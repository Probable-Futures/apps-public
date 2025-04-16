--! Previous: sha1:fbfb42fafa9fcbb5bd0cca1902cef8e92f0be9e8
--! Hash: sha1:a3eacd586236f4df0f843b24d33c506ea888cdfb

--! split: 1-current.sql
create extension if not exists vector;

create schema if not exists knowledge;

drop type if exists knowledge.post_type cascade;
create type knowledge.post_type as enum ('perspectives', 'volumes', 'pages');

create table if not exists knowledge.posts (
    id serial primary key,
    title text not null,
    modified_at timestamp default current_timestamp,
    content text not null,
    content_type knowledge.post_type not null,
    json_content jsonb
);

create table if not exists knowledge.posts_embeddings (
    id serial primary key,
    post_id int references knowledge.posts(id) on delete cascade,
    content_order int not null,
    content_tokens int not null,
    content text not null,
    embedding vector(1536)
);

create index if not exists posts_embeddings_embedding_idx
  on knowledge.posts_embeddings using ivfflat (embedding);
