create table if not exists tracks (
  id text primary key,
  title text not null,
  artist text not null,
  album text not null default '',
  cover text not null default '',
  duration integer not null default 0,
  synthGenre text not null default 'electronic',
  lyrics jsonb,
  liked boolean default false,
  isPodcast boolean default false,
  audio_file text,
  audio_url text,
  user_email text
);

create table if not exists playlists (
  id text primary key,
  name text not null,
  description text,
  cover text not null default '',
  tracks jsonb not null default '[]',
  isCustom boolean default false,
  user_email text
);

alter table tracks enable row level security;
alter table playlists enable row level security;

create policy "Public read" on tracks for select using (true);
create policy "Public insert" on tracks for insert with check (true);
create policy "Public update" on tracks for update using (true);
create policy "Public delete" on tracks for delete using (true);

create policy "Public read" on playlists for select using (true);
create policy "Public insert" on playlists for insert with check (true);
create policy "Public update" on playlists for update using (true);
create policy "Public delete" on playlists for delete using (true);

-- Supabase Storage: create 'audio' bucket (run in Supabase Dashboard > Storage)
-- insert into storage.buckets (id, name, public) values ('audio', 'audio', true);

-- Storage policy: allow public read
-- create policy "Public read audio" on storage.objects for select using (bucket_id = 'audio');

-- Storage policy: allow authenticated insert
-- create policy "Anyone can upload audio" on storage.objects for insert with check (bucket_id = 'audio');

-- Storage policy: allow delete
-- create policy "Anyone can delete audio" on storage.objects for delete using (bucket_id = 'audio');
