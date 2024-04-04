--! Previous: sha1:4e998ed926b22a4f6c986bd8811d42102d766bb9
--! Hash: sha1:5206a439f0645834f6e4e986bbb19ae69a275c8d

--! split: 1-current.sql
drop function if exists pf_public.create_pf_country_statistics (country_id uuid, dataset_id int);

create or replace function pf_public.create_pf_country_statistics (country_id uuid, dataset_id int)
  returns setof pf_private.pf_country_statistics
  language plpgsql security DEFINER
  as $$
  declare 
    country_statistics pf_private.pf_country_statistics;
  begin
  select * into country_statistics 
  from pf_private.pf_country_statistics cs 
  where cs.country_id = create_pf_country_statistics.country_id 
  and cs.dataset_id = create_pf_country_statistics.dataset_id
  and (cs.status = 'successful' or cs.status = 'in progress');
  if country_statistics is null then
    insert into pf_private.pf_country_statistics (country_id, dataset_id)
      values (create_pf_country_statistics.country_id, create_pf_country_statistics.dataset_id) 
        returning * into country_statistics;
  end if;
  return next country_statistics;
  end;
$$;

grant all on function pf_public.create_pf_country_statistics (country_id uuid, dataset_id int) to :AUTHENTICATED_ROLE;
