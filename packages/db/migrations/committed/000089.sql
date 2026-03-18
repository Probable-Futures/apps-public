--! Previous: sha1:f9e9f418795c274925590b8a1504496bfbc30ed2
--! Hash: sha1:b7a4e8a6e605f17d05af70d1db5aa2ee30049ea1

--! split: 1-current.sql
-- Recreate the ivfflat index for better performance with cosine similarity
DROP INDEX IF EXISTS knowledge.adaptation_embeddings_embedding_idx;

CREATE INDEX IF NOT EXISTS adaptation_embeddings_embedding_idx ON knowledge.adaptation_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH
  (lists = 100);

-- Adaptation tool session persistence
CREATE TABLE
  IF NOT EXISTS knowledge.adaptation_sessions (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    current_step INT NOT NULL DEFAULT 0,
    session_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
  );

CREATE INDEX IF NOT EXISTS idx_adaptation_sessions_username ON knowledge.adaptation_sessions (username);
