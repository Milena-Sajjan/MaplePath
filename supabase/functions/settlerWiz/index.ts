import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, userProfile, query } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Generate embedding for the user's query
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    })
    const embeddingData = await embeddingRes.json()
    const embedding = embeddingData?.data?.[0]?.embedding

    // 2. Search knowledge base with pgvector
    let context = ''
    if (embedding) {
      const { data: docs } = await supabaseClient.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.75,
        match_count: 5,
      })
      context = docs?.map((d: any) =>
        `[${d.source_name}] ${d.title}: ${d.content}`
      ).join('\n\n') ?? ''
    }

    // 3. Build system prompt with user context + retrieved docs
    const systemPrompt = `You are SettlerWiz, a knowledgeable, warm, and judgment-free AI assistant for newcomers settling in Canada.

USER PROFILE:
- Status: ${userProfile?.status_type || 'unknown'}
- City: ${userProfile?.city || 'unknown'}, ${userProfile?.province || 'unknown'}
- University: ${userProfile?.university ?? 'N/A'}
- Arrival date: ${userProfile?.arrival_date ?? 'unknown'}
- Languages: ${userProfile?.languages?.join(', ') || 'English'}

KNOWLEDGE BASE CONTEXT (cite these sources in your answer):
${context}

INSTRUCTIONS:
- Be warm, clear, and practical. Speak like a trusted friend who knows Canadian systems.
- Always cite your sources using [Source Name] format.
- If you reference a government link, include the full URL.
- If you're not sure about something, say so and recommend the official source.
- Keep responses under 300 words unless a detailed step-by-step is clearly needed.
- If the user's preferred language is not English, respond in that language.`

    // 4. Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10),
        ],
        max_tokens: 600,
        temperature: 0.4,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.'

    // 5. Extract sources from reply
    const sourceMatches = reply.match(/\[([^\]]+)\]/g) ?? []
    const sources = [...new Set(sourceMatches.map((s: string) => s.slice(1, -1)))]

    return new Response(
      JSON.stringify({ reply, sources }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process request', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
