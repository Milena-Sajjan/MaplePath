create or replace function match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id uuid, title text, content text,
  source_name text, source_url text, similarity float
) language sql stable as $$
  select id, title, content, source_name, source_url,
    1 - (embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
