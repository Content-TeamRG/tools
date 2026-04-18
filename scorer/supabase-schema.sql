-- Run this in your Supabase SQL editor to set up the reports table

create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  report jsonb not null,
  share_token text unique
);

-- Index for fast token lookups
create index if not exists reports_share_token_idx on reports (share_token);

-- Row Level Security (optional - enable if you add auth)
-- alter table reports enable row level security;
-- create policy "Public reports are viewable by everyone" on reports for select using (true);
-- create policy "Authenticated users can insert" on reports for insert with check (auth.role() = 'authenticated');
