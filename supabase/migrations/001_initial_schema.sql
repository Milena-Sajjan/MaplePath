-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- PROFILES
create table profiles (
  id                  uuid references auth.users primary key,
  full_name           text,
  avatar_url          text,
  status_type         text check (status_type in
    ('international_student','permanent_resident','visitor','refugee')),
  university          text,
  program             text,
  arrival_date        date,
  city                text default 'Ottawa',
  province            text default 'Ontario',
  country_of_origin   text,
  languages           text[] default '{}',
  sin_obtained        boolean default false,
  ohip_status         text default 'not_started',
  study_permit_expiry date,
  preferred_language  text default 'en',
  onboarding_complete boolean default false,
  email_notifications boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ROADMAP PROGRESS
create table roadmap_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade,
  step_id      text not null,
  phase        integer not null,
  completed    boolean default false,
  completed_at timestamptz,
  notes        text,
  unique(user_id, step_id)
);

-- MAP PINS
create table map_pins (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  title       text not null,
  category    text check (category in
    ('food','community','health','banking','education',
     'transport','housing','worship','recreation','other')),
  description text,
  address     text,
  latitude    double precision not null,
  longitude   double precision not null,
  city        text,
  languages   text[],
  website     text,
  phone       text,
  hours       text,
  verified    boolean default false,
  upvotes     integer default 0,
  image_url   text,
  created_at  timestamptz default now()
);

-- CHAT MESSAGES
create table chat_messages (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  role       text check (role in ('user','assistant','system')),
  content    text not null,
  sources    jsonb,
  created_at timestamptz default now()
);

-- KNOWLEDGE BASE (RAG)
create table knowledge_base (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  content     text not null,
  source_url  text,
  source_name text,
  category    text,
  province    text,
  status_type text[],
  language    text default 'en',
  embedding   vector(1536),
  created_at  timestamptz default now()
);

create index on knowledge_base
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- FORUM POSTS
create table forum_posts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  title       text not null,
  content     text not null,
  category    text check (category in
    ('housing','jobs','immigration','banking','health',
     'community','education','general')),
  tags        text[] default '{}',
  city        text,
  upvotes     integer default 0,
  reply_count integer default 0,
  pinned      boolean default false,
  language    text default 'en',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table forum_replies (
  id         uuid default gen_random_uuid() primary key,
  post_id    uuid references forum_posts(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  content    text not null,
  upvotes    integer default 0,
  is_answer  boolean default false,
  created_at timestamptz default now()
);

-- JOB LISTINGS
create table job_listings (
  id               uuid default gen_random_uuid() primary key,
  posted_by        uuid references profiles(id),
  title            text not null,
  company          text not null,
  description      text not null,
  requirements     text,
  job_type         text check (job_type in
    ('on_campus','off_campus','co_op','internship',
     'part_time','full_time','volunteer')),
  salary_range     text,
  location         text,
  city             text,
  remote           boolean default false,
  status_types     text[],
  languages_needed text[],
  application_url  text,
  contact_email    text,
  deadline         date,
  is_active        boolean default true,
  views            integer default 0,
  created_at       timestamptz default now()
);

create table job_applications (
  id           uuid default gen_random_uuid() primary key,
  job_id       uuid references job_listings(id) on delete cascade,
  user_id      uuid references profiles(id) on delete cascade,
  cover_letter text,
  resume_url   text,
  status       text default 'pending',
  created_at   timestamptz default now(),
  unique(job_id, user_id)
);

-- HOUSING LISTINGS
create table housing_listings (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id) on delete cascade,
  title           text not null,
  description     text not null,
  listing_type    text check (listing_type in
    ('room','apartment','house','basement','homestay','roommate_wanted')),
  price_monthly   integer not null,
  bedrooms        integer,
  bathrooms       integer,
  address         text,
  city            text not null,
  latitude        double precision,
  longitude       double precision,
  available_from  date,
  furnished       boolean default false,
  utilities       boolean default false,
  pets_allowed    boolean default false,
  gender_pref     text,
  student_only    boolean default true,
  images          text[] default '{}',
  amenities       text[] default '{}',
  languages       text[],
  is_active       boolean default true,
  views           integer default 0,
  created_at      timestamptz default now()
);

create table housing_inquiries (
  id         uuid default gen_random_uuid() primary key,
  listing_id uuid references housing_listings(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  message    text not null,
  status     text default 'pending',
  created_at timestamptz default now()
);

-- RESOURCES
create table resources (
  id          uuid default gen_random_uuid() primary key,
  category    text not null,
  title       text not null,
  description text,
  url         text,
  phone       text,
  address     text,
  city        text,
  province    text,
  language    text[] default '{en}',
  status_type text[],
  free        boolean default true,
  verified    boolean default true,
  created_at  timestamptz default now()
);

-- NOTIFICATIONS
create table notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  type       text,
  title      text not null,
  body       text,
  read       boolean default false,
  action_url text,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table profiles          enable row level security;
alter table roadmap_progress  enable row level security;
alter table map_pins          enable row level security;
alter table chat_messages     enable row level security;
alter table knowledge_base    enable row level security;
alter table forum_posts       enable row level security;
alter table forum_replies     enable row level security;
alter table job_listings      enable row level security;
alter table job_applications  enable row level security;
alter table housing_listings  enable row level security;
alter table housing_inquiries enable row level security;
alter table resources         enable row level security;
alter table notifications     enable row level security;

-- Profiles
create policy "own profile"        on profiles for all    using (auth.uid() = id);
-- Roadmap
create policy "own roadmap"        on roadmap_progress for all using (auth.uid() = user_id);
-- Chat
create policy "own chat"           on chat_messages for all   using (auth.uid() = user_id);
-- Knowledge base public read
create policy "kb public read"     on knowledge_base for select using (true);
-- Map pins
create policy "pins public read"   on map_pins for select     using (true);
create policy "pins own write"     on map_pins for insert     with check (auth.uid() = user_id);
create policy "pins own update"    on map_pins for update     using (auth.uid() = user_id);
create policy "pins own delete"    on map_pins for delete     using (auth.uid() = user_id);
-- Forum
create policy "forum public read"  on forum_posts for select  using (true);
create policy "forum own write"    on forum_posts for insert  with check (auth.uid() = user_id);
create policy "forum own update"   on forum_posts for update  using (auth.uid() = user_id);
create policy "replies public"     on forum_replies for select using (true);
create policy "replies own write"  on forum_replies for insert with check (auth.uid() = user_id);
-- Jobs
create policy "jobs public read"   on job_listings for select  using (true);
create policy "jobs own write"     on job_listings for insert  with check (auth.uid() = posted_by);
create policy "apps own"           on job_applications for all using (auth.uid() = user_id);
-- Housing
create policy "housing public"     on housing_listings for select using (true);
create policy "housing own write"  on housing_listings for insert with check (auth.uid() = user_id);
create policy "housing own update" on housing_listings for update using (auth.uid() = user_id);
create policy "inquiries own"      on housing_inquiries for all using (auth.uid() = user_id);
-- Resources
create policy "resources public"   on resources for select     using (true);
-- Notifications
create policy "own notifications"  on notifications for all    using (auth.uid() = user_id);

-- Match knowledge function for RAG
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
