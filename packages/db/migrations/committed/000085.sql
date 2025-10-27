--! Previous: sha1:62a661cbedeadb0fbbdbbd00672fe2d15ec3444c
--! Hash: sha1:6d7e45cf66c79526540d593b318c79de7261d632

--! split: 1-current.sql
alter table
    pf_public.pf_dataset_statistics
add
    column if not exists mean_value numeric(6,1);

alter table
    pf_public.pf_dataset_statistics
add
    column if not exists median_value numeric(6,1);
