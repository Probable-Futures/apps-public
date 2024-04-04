import Map from "../components/Maps/Interactive";
import { DataProvider } from "../contexts/DataContext";
import { TourProvider } from "../contexts/TourContext";

const PublicMaps = () => (
  <DataProvider>
    <TourProvider>
      <Map />
    </TourProvider>
  </DataProvider>
);

export default PublicMaps;
