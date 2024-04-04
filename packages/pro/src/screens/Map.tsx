import { DataProvider } from "../contexts/DataContext";
import InteractiveMap from "../components/Map/InteractiveMap";

const Map = (): JSX.Element => {
  return (
    <DataProvider>
      <InteractiveMap />
    </DataProvider>
  );
};

export default Map;
