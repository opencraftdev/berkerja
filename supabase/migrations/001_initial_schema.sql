CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  file_name TEXT NOT NULL,
  analysis_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  queries TEXT[] NOT NULL DEFAULT '{}',
  generation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS keywords_user_cv_idx ON keywords(user_id, cv_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_platform') THEN
    CREATE TYPE job_platform AS ENUM ('glints', 'linkedin', 'jobstreet');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('new', 'clicked', 'pending', 'applied');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  url TEXT NOT NULL,
  description_snippet TEXT,
  full_description TEXT,
  platform job_platform NOT NULL,
  keyword_query TEXT,
  status job_status NOT NULL DEFAULT 'new',
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_user_idx ON jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_platform_idx ON jobs(platform);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own CVs" ON cvs;
CREATE POLICY "Users can manage own CVs" ON cvs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own keywords" ON keywords;
CREATE POLICY "Users can manage own keywords" ON keywords FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;
CREATE POLICY "Users can manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
