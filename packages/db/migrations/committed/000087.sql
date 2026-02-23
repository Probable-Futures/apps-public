--! Previous: sha1:920221ff7e1ac853c4ae637aa9eb94a7c39245a6
--! Hash: sha1:d18769d5080f90a41cbfb8465df7cd277ab8585f

--! split: 1-current.sql
create table
  if not exists knowledge.adaptation_documents (
    id serial primary key,
    record_id text not null,
    title text not null,
    file_name text not null,
    file_url text not null,
    source_url text,
    metadata jsonb,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
  );

create unique index if not exists adaptation_documents_record_file_idx on knowledge.adaptation_documents (record_id, file_url);

create table
  if not exists knowledge.adaptation_embeddings (
    id serial primary key,
    document_id int references knowledge.adaptation_documents (id) on delete cascade,
    content_order int not null,
    content_tokens int not null,
    content text not null,
    page_number int,
    embedding vector (1536),
    metadata jsonb
  );

create index if not exists adaptation_embeddings_embedding_idx on knowledge.adaptation_embeddings using ivfflat (embedding);
