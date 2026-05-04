--! Previous: sha1:1e6c2a02e05d4cabc3b3ce0f8b67c6d5ebe67832
--! Hash: sha1:81494a68f5af03d540920af580f019190935ffbd

--! split: 1-current.sql
ALTER TABLE knowledge.adaptation_case_studies
ADD COLUMN IF NOT EXISTS ai_name text;
