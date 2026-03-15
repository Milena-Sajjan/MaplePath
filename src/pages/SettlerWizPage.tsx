import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Bot, User, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useSearchParams } from 'react-router-dom';
import { formatTimeAgo } from '../lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  created_at: string;
}

export default function SettlerWizPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickSuggestions = [
    'How do I get OHIP?',
    'Can I work off-campus?',
    'How do I file taxes?',
    'What is the GST/HST credit?',
    'How do I apply for PGWP?',
    'How do I find a family doctor?',
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        setMessages(
          (data || []).map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            sources: msg.sources,
            created_at: msg.created_at,
          }))
        );
      } catch (err: any) {
        setError(err.message || t('settlerWiz.errorLoadingMessages', 'Failed to load messages.'));
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user, t]);

  useEffect(() => {
    if (isLoading) return;
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchParams({}, { replace: true });
      sendMessage(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, searchParams]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user || isTyping) return;

      setError(null);
      const userMessage = text.trim();
      setInput('');

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const { error: insertError } = await supabase.from('chat_messages').insert({
          id: userMsg.id,
          user_id: user.id,
          role: 'user',
          content: userMessage,
          created_at: userMsg.created_at,
        });

        if (insertError) throw insertError;

        let queryContent = userMessage;
        if (profile?.preferred_language && profile.preferred_language !== 'en') {
          queryContent = `Please respond in ${profile.preferred_language}: ${userMessage}`;
        }

        const { data: fnData, error: fnError } = await supabase.functions.invoke('settlerWiz', {
          body: {
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            userProfile: profile,
            query: queryContent,
          },
        });

        if (fnError) throw fnError;

        const { reply, sources } = fnData as { reply: string; sources?: string[] };

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
          sources: sources && sources.length > 0 ? sources : undefined,
          created_at: new Date().toISOString(),
        };

        const { error: assistantInsertError } = await supabase.from('chat_messages').insert({
          id: assistantMsg.id,
          user_id: user.id,
          role: 'assistant',
          content: assistantMsg.content,
          sources: assistantMsg.sources,
          created_at: assistantMsg.created_at,
        });

        if (assistantInsertError) throw assistantInsertError;

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setError(err.message || t('settlerWiz.errorSending', 'Failed to send message. Please try again.'));
      } finally {
        setIsTyping(false);
        inputRef.current?.focus();
      }
    },
    [user, profile, messages, isTyping, t]
  );

  const handleClearConversation = async () => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setMessages([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || t('settlerWiz.errorClearing', 'Failed to clear conversation.'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <span role="img" aria-label="owl">
                🦉
              </span>
              {t('settlerWiz.title', 'SettlerWiz AI')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settlerWiz.subtitle', 'Your 24/7 settlement assistant')}
            </p>
          </div>
          <button
            onClick={handleClearConversation}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
            title={t('settlerWiz.clearConversation', 'Clear conversation')}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('settlerWiz.clear', 'Clear')}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Suggestions */}
      {messages.length === 0 && !isLoading && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-medium text-gray-500">
              {t('settlerWiz.suggestions', 'Try asking:')}
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleChipClick(suggestion)}
                  disabled={isTyping}
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#C8102E] hover:text-[#C8102E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#C8102E]" />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Bot className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700">
                {t('settlerWiz.welcome', 'Welcome to SettlerWiz!')}
              </h2>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                {t(
                  'settlerWiz.welcomeDescription',
                  'Ask me anything about settling in Canada — healthcare, taxes, work permits, and more.'
                )}
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-sm" role="img" aria-label="owl">
                      🦉
                    </span>
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-[#C8102E] text-white'
                        : 'border border-gray-100 bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {msg.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 transition-colors hover:bg-blue-100"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t('settlerWiz.source', 'Source')} {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <p
                    className={`mt-1 text-xs text-gray-400 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTimeAgo(msg.created_at)}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="ml-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C8102E]">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm" role="img" aria-label="owl">
                  🦉
                </span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('settlerWiz.placeholder', 'Ask about settling in Canada...')}
            disabled={isTyping}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-[#C8102E] focus:outline-none focus:ring-1 focus:ring-[#C8102E] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8102E] text-white transition-colors hover:bg-[#a00d24] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
