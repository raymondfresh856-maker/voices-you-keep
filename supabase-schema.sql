-- ============================================================
-- Voices You Keep™ — Supabase Database Schema
-- Run this in the Supabase SQL Editor to bootstrap your tables
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 1. Profiles (extends Supabase Auth users)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'KEEPER', 'LEGACY')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cards_used_lifetime INT NOT NULL DEFAULT 0,
  cards_used_this_month INT NOT NULL DEFAULT 0,
  month_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---------------------------------------------------------
-- 2. Card Themes (seeded data, public read)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS card_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🎉',
  bg_color TEXT NOT NULL DEFAULT '#1A1330',
  text_color TEXT NOT NULL DEFAULT '#F3F4F6',
  accent_color TEXT NOT NULL DEFAULT '#F59E0B',
  tier_required TEXT NOT NULL DEFAULT 'FREE' CHECK (tier_required IN ('FREE', 'KEEPER', 'LEGACY')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE card_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read themes"
  ON card_themes FOR SELECT
  USING (true);

-- Seed themes
INSERT INTO card_themes (id, name, description, emoji, bg_color, accent_color, tier_required, sort_order) VALUES
  ('birthday',      'Happy Birthday',    'Celebrate another year of joy',                      '🎂', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '#F59E0B', 'FREE',   1),
  ('love',          'With Love',         'Express your deepest feelings',                       '❤️', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', '#FF6B6B', 'FREE',   2),
  ('thank-you',     'Thank You',         'Show your gratitude',                                 '🙏', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', '#00D4FF', 'FREE',   3),
  ('congratulations','Congratulations',  'Celebrate achievements big and small',                '🎉', 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', '#43E97B', 'FREE',   4),
  ('anniversary',   'Anniversary',       'Mark another year together',                          '💍', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', '#FA709A', 'KEEPER', 5),
  ('graduation',    'Graduation',        'Cap, gown, and a voice full of pride',                '🎓', 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', '#A18CD1', 'KEEPER', 6),
  ('holiday',       'Holiday Cheer',     'Warm wishes for the season',                          '🎄', 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', '#FF4444', 'KEEPER', 7),
  ('get-well',      'Get Well Soon',     'Send healing vibes and comfort',                      '🌻', 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', '#F6D365', 'KEEPER', 8),
  ('baby',          'New Baby',          'Welcome the newest family member',                    '👶', 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', '#FCB69F', 'KEEPER', 9),
  ('memorial',      'In Memory',         'Honor and remember those who meant everything',       '🕯️', 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', '#E8D5B7', 'KEEPER',10),
  ('encouragement', 'You Got This',      'Uplift someone who needs strength',                   '💪', 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', '#FF9A9E', 'KEEPER',11),
  ('miss-you',      'Miss You',          'Bridge the distance with your voice',                 '💜', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '#764BA2', 'KEEPER',12)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------
-- 3. Cards
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL REFERENCES card_themes(id),
  title TEXT NOT NULL,
  message TEXT,
  sender_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'opened')),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  audio_url TEXT,
  audio_duration INT,
  open_count INT NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cards"
  ON cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  USING (auth.uid() = user_id);

-- Public access for share tokens (recipients viewing cards)
CREATE POLICY "Anyone can view shared cards"
  ON cards FOR SELECT
  USING (share_token IS NOT NULL AND status IN ('sent', 'delivered', 'opened'));

-- ---------------------------------------------------------
-- 4. Audio Files (metadata; actual files in Supabase Storage)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'audio/webm',
  file_size INT,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audio"
  ON audio_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio"
  ON audio_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 5. Storage bucket for audio
-- ---------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-audio', 'card-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'card-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'card-audio');

-- ---------------------------------------------------------
-- 6. Helper function: reset monthly card counts
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_monthly_card_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET cards_used_this_month = 0,
      month_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
  WHERE month_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
