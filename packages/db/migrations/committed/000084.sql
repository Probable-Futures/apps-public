--! Previous: sha1:36c533ea4290f116dcdcec1306aadcea2c2c3076
--! Hash: sha1:62a661cbedeadb0fbbdbbd00672fe2d15ec3444c

--! split: 1-current.sql
alter table knowledge.posts add column if not exists link text not null default '';
