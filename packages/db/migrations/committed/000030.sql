--! Previous: sha1:482e9298e52a7df20ad20e3bf49cbf59eb04df93
--! Hash: sha1:aea5e211555fa9f5d5aaa0889b77bd49b5537aca

--! split: 1-current.sql
-- This function is not needed anymore. It was used before insert or update on pf_public.pf_dataset_statistics
-- to set the coordinate_id in pf_public.pf_dataset_statistics based on coordinate_hash. However, coordinate_id was removed from  pf_public.pf_dataset_statistics
drop function if exists pf_private.set_coordinate_id_from_hash;

-- drop the GENERATED ALWAYS expression on cell column
alter table pf_public.pf_grid_coordinates alter column cell drop expression if exists;

create or replace function pf_private.set_cell_from_model() 
  returns trigger as $$
begin
  NEW.cell = (
    case
      when TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and OLD.cell is distinct from NEW.cell) 
        then case
          when NEW.grid = 'RCM' then ST_MakeEnvelope(
            ((ST_X(NEW.point :: geometry)) - 0.09999999660721),
            ((ST_Y(NEW.point :: geometry)) + 0.099999999999991),
            ((ST_X(NEW.point :: geometry)) + 0.09999999660721),
            ((ST_Y(NEW.point :: geometry)) - 0.099999999999991),
            4326
          ) :: geography
          when NEW.grid = 'GCM' then ST_MakeEnvelope(
            ((ST_X(NEW.point :: geometry)) - 0.75225225),
            ((ST_Y(NEW.point :: geometry)) + 0.75225225),
            ((ST_X(NEW.point :: geometry)) + 0.75225225),
            ((ST_Y(NEW.point :: geometry)) - 0.75225225),
            4326
          ) :: geography
        end
      else OLD.cell
    end
  );
  return NEW;
end;
$$ language plpgsql volatile;
comment on function pf_private.set_cell_from_model() is 
  E'Trigger function to set cell for new rows';

drop trigger if exists _200_set_cell on pf_public.pf_grid_coordinates cascade;
create trigger _200_set_cell before insert or update
  on pf_public.pf_grid_coordinates for each row execute procedure pf_private.set_cell_from_model();
comment on trigger _200_set_cell on pf_public.pf_grid_coordinates is
  E'Set cell from point and based on the model';
