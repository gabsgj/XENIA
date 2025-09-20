-- Create table to store aggregated user progress per topic
CREATE TABLE IF NOT EXISTS public.user_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  quizzes_taken INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  last_score DOUBLE PRECISION DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, topic)
);

-- Create table to store historical quiz attempts per user-topic
CREATE TABLE IF NOT EXISTS public.user_progress_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  score DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_topic ON public.user_progress(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_user_progress_history_user_created ON public.user_progress_history(user_id, created_at);
