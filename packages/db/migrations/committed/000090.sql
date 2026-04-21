--! Previous: sha1:b7a4e8a6e605f17d05af70d1db5aa2ee30049ea1
--! Hash: sha1:1e6c2a02e05d4cabc3b3ce0f8b67c6d5ebe67832

--! split: 1-current.sql
-- 1. Add new columns to adaptation_documents
ALTER TABLE knowledge.adaptation_documents
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS summary_embedding vector (1536),
ADD COLUMN IF NOT EXISTS author text,
ADD COLUMN IF NOT EXISTS publication_date date,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS geography text,
ADD COLUMN IF NOT EXISTS source_type text,
ADD COLUMN IF NOT EXISTS adaptation_type text,
ADD COLUMN IF NOT EXISTS case_studies text,
ADD COLUMN IF NOT EXISTS licensing_status text;

-- 2. Create the Vector index for the new summary_embedding column
-- Note: This uses IVFFlat with cosine operators as per your schema
CREATE INDEX IF NOT EXISTS adaptation_documents_summary_embedding_idx ON knowledge.adaptation_documents USING ivfflat (summary_embedding vector_cosine_ops)
WITH
  (lists = 100);

-- 3. Create B-Tree indexes for filtering on metadata fields
CREATE INDEX IF NOT EXISTS adaptation_documents_geography_idx ON knowledge.adaptation_documents (geography);

CREATE INDEX IF NOT EXISTS adaptation_documents_sector_idx ON knowledge.adaptation_documents (sector);

-- Full-text search support for hybrid BM25 + vector retrieval
ALTER TABLE knowledge.adaptation_embeddings
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate search_vector for any existing rows
UPDATE knowledge.adaptation_embeddings
  SET search_vector = to_tsvector('english', content)
  WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS adaptation_embeddings_fts_idx
  ON knowledge.adaptation_embeddings USING gin(search_vector);

-- Heading hierarchy for contextual chunking
ALTER TABLE knowledge.adaptation_embeddings
  ADD COLUMN IF NOT EXISTS heading_path text;

-- Strategy catalog: pre-extracted adaptation strategies from documents
CREATE TABLE IF NOT EXISTS knowledge.adaptation_strategies (
  id serial PRIMARY KEY,
  document_id int REFERENCES knowledge.adaptation_documents(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  target_sectors text[] NOT NULL DEFAULT '{}',
  target_hazards text[] NOT NULL DEFAULT '{}',
  implementation_steps text,
  cost_level text,
  timeframe text,
  effectiveness_indicators text,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS adaptation_strategies_sectors_idx
  ON knowledge.adaptation_strategies USING gin(target_sectors);
CREATE INDEX IF NOT EXISTS adaptation_strategies_hazards_idx
  ON knowledge.adaptation_strategies USING gin(target_hazards);
CREATE INDEX IF NOT EXISTS adaptation_strategies_embedding_idx
  ON knowledge.adaptation_strategies USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Case studies catalog: pre-extracted case studies from documents
CREATE TABLE IF NOT EXISTS knowledge.adaptation_case_studies (
  id serial PRIMARY KEY,
  document_id int REFERENCES knowledge.adaptation_documents(id) ON DELETE CASCADE,
  company_name text,
  sector text,
  location text,
  hazards_addressed text[] NOT NULL DEFAULT '{}',
  strategies_used text[] NOT NULL DEFAULT '{}',
  outcomes text,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS adaptation_case_studies_hazards_idx
  ON knowledge.adaptation_case_studies USING gin(hazards_addressed);

-- Frameworks catalog: pre-extracted frameworks from documents
CREATE TABLE IF NOT EXISTS knowledge.adaptation_frameworks (
  id serial PRIMARY KEY,
  document_id int REFERENCES knowledge.adaptation_documents(id) ON DELETE CASCADE,
  name text NOT NULL,
  organization text,
  purpose text,
  applicable_sectors text[] NOT NULL DEFAULT '{}',
  key_steps text,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS adaptation_frameworks_sectors_idx
  ON knowledge.adaptation_frameworks USING gin(applicable_sectors);
