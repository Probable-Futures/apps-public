--! Previous: sha1:f4b0f440bfb2220ff291b4eae19ec1364519bbe8
--! Hash: sha1:5771c700d76c79262346fe5a92a1805c8d52637f

--! split: 1-current.sql
alter table pf_public.pf_maps
add column "order" integer;

create index pf_map_order_idx on pf_public.pf_maps ("order");
