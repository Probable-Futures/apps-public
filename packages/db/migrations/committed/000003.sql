--! Previous: sha1:5771c700d76c79262346fe5a92a1805c8d52637f
--! Hash: sha1:ded026231cdf4c149a43aa0bb31054d8c955aaaf

--! split: 1-current.sql
update pf_public.pf_dataset_units
set unit_long = 'Number of days per year'
where unit = 'days';
