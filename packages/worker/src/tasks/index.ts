import process_partner_dataset from "./process_partner_dataset";
import enrich_partner_dataset from "./enrich_partner_dataset";
import delete_partner_dataset_files from "./delete_partner_dataset_files";
import add_nearby_pf_coordinates_to_partner_dataset from "./add_nearby_pf_coordinates_to_partner_dataset";
import create_statistics_file from "./create_statistics_file";

const tasksList = {
  process_partner_dataset,
  enrich_partner_dataset,
  add_nearby_pf_coordinates_to_partner_dataset,
  delete_partner_dataset_files,
  create_statistics_file,
};

export default tasksList;
