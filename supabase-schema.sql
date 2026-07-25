-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Criar tabela tracks (se não existir)
create table if not exists tracks (
  id text primary key,
  title text not null,
  artist text not null,
  album text not null default '',
  cover text not null default '',
  duration integer not null default 0,
  lyrics jsonb,
  liked boolean default false,
  audio_url text,
  user_email text
);

-- 2. Adicionar colunas que podem não existir (ignora erro se já existir)
do $$ begin
  alter table tracks add column synthGenre text not null default 'electronic';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table tracks add column isPodcast boolean default false;
exception when duplicate_column then null;
end $$;

-- 3. Criar tabela playlists (se não existir)
create table if not exists playlists (
  id text primary key,
  name text not null,
  description text,
  cover text not null default '',
  tracks jsonb not null default '[]',
  isCustom boolean default false,
  user_email text
);

-- 4. Habilitar RLS (Row Level Security)
alter table tracks enable row level security;
alter table playlists enable row level security;

-- 5. Políticas de acesso público (qualquer um pode ler, escrever, atualizar, deletar)
do $$ begin
  create policy "Public read" on tracks for select using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Public insert" on tracks for insert with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Public update" on tracks for update using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Public delete" on tracks for delete using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public read" on playlists for select using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Public insert" on playlists for insert with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Public update" on playlists for update using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Public delete" on playlists for delete using (true);
exception when duplicate_object then null;
end $$;

-- 6. Criar bucket de áudio no Storage (se não existir)
-- Execute manualmente no Supabase Dashboard > Storage > New Bucket:
-- Nome: audio | Public: true
