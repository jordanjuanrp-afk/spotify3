-- ============================================
-- SCHEMA COMPLETO DO SUPABASE
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Execute CADA bloco separadamente se der erro
-- ============================================

-- 1. Criar tabela tracks
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT NOT NULL DEFAULT '',
  cover TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 0,
  synthGenre TEXT NOT NULL DEFAULT 'electronic',
  lyrics JSONB,
  liked BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  user_email TEXT
);

-- 2. Criar tabela playlists
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover TEXT NOT NULL DEFAULT '',
  tracks JSONB NOT NULL DEFAULT '[]',
  isCustom BOOLEAN DEFAULT FALSE,
  user_email TEXT
);

-- 3. Habilitar RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso público para tracks
CREATE POLICY "Public read tracks" ON tracks FOR SELECT USING (TRUE);
CREATE POLICY "Public insert tracks" ON tracks FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public update tracks" ON tracks FOR UPDATE USING (TRUE);
CREATE POLICY "Public delete tracks" ON tracks FOR DELETE USING (TRUE);

-- 5. Políticas de acesso público para playlists
CREATE POLICY "Public read playlists" ON playlists FOR SELECT USING (TRUE);
CREATE POLICY "Public insert playlists" ON playlists FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public update playlists" ON playlists FOR UPDATE USING (TRUE);
CREATE POLICY "Public delete playlists" ON playlists FOR DELETE USING (TRUE);

-- 6. Criar bucket de áudio no Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Políticas de Storage para o bucket 'audio'
CREATE POLICY "Public read audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "Anyone can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio');
CREATE POLICY "Anyone can delete audio" ON storage.objects FOR DELETE USING (bucket_id = 'audio');
