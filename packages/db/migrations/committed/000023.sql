--! Previous: sha1:940859ebdf33141603a823188827b16448c677fd
--! Hash: sha1:03739df8f205ecc56af42b147dacb5a2f78389cb

--! split: 1-current.sql
update
  pf_public.pf_dataset_units
set
  unit_long = 'Change in annual precipitation (cm)'
where
  unit = 'cm';
