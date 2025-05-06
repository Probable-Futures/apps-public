--! Previous: sha1:a3eacd586236f4df0f843b24d33c506ea888cdfb
--! Hash: sha1:36c533ea4290f116dcdcec1306aadcea2c2c3076

--! split: 1-current.sql
-- Create enum for conversation state
drop type if exists knowledge.conversation_state cascade;
CREATE TYPE knowledge.conversation_state AS ENUM ('AWAITING_QUERY', 'AWAITING_CLIMATE_CONDITION');

create table if not exists knowledge.users (
  id uuid default gen_random_uuid() primary key,
  sub text unique not null,
  name text,
  email citext not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function knowledge.upsert_user_and_log_last_active_at(
  sub text,
  email citext,
  name text
) returns knowledge.users
  language plpgsql strict security definer
  as $$
  declare
    _user knowledge.users;
  begin
    if not exists (select * from knowledge.users
        where knowledge.users.sub = upsert_user_and_log_last_active_at.sub)
      then
      insert into knowledge.users
        (sub, email, name)
      values
        (upsert_user_and_log_last_active_at.sub,
         upsert_user_and_log_last_active_at.email,
         upsert_user_and_log_last_active_at.name);
    end if;
    update knowledge.users set last_seen_at = now()
    where knowledge.users.sub = upsert_user_and_log_last_active_at.sub
      and last_seen_at < now() - interval '5 minutes';
    select * from knowledge.users
      where knowledge.users.sub = upsert_user_and_log_last_active_at.sub
      into _user;
    return _user;
  end;
  $$;


-- Main conversations table
CREATE TABLE if not exists knowledge.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_session_id TEXT UNIQUE,
  user_id UUID NULL REFERENCES knowledge.users(id) on DELETE CASCADE,
  summary TEXT DEFAULT '',
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  state knowledge.conversation_state NOT NULL DEFAULT 'AWAITING_QUERY',
  extracted_locations JSONB
);

-- Messages associated with conversations
CREATE TABLE if not exists knowledge.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES knowledge.conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'human', 'ai', 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  order_index INTEGER NOT NULL -- To maintain message order
);

-- Context summaries
CREATE TABLE if not exists knowledge.context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES knowledge.conversations(id) ON DELETE CASCADE,
  raw_context TEXT NOT NULL,
  summary TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX if not exists idx_conversations_anon_session_id ON knowledge.conversations(anon_session_id);
CREATE INDEX if not exists idx_conversations_user_id ON knowledge.conversations(user_id); -- Index for user lookups
CREATE INDEX if not exists idx_messages_conversation_id ON knowledge.messages(conversation_id);
CREATE INDEX if not exists idx_context_summaries_conversation_id ON knowledge.context_summaries(conversation_id);
CREATE INDEX if not exists idx_messages_conversation_id_order ON knowledge.messages(conversation_id, order_index);
