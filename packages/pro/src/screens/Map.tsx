import { DataProvider } from "../contexts/DataContext";
import { UIStateProvider } from "../contexts/UIStateContext";
import InteractiveMap from "../components/Map/InteractiveMap";

const Map = (): JSX.Element => {
  return (
    <DataProvider>
      <UIStateProvider>
        <InteractiveMap />
      </UIStateProvider>
    </DataProvider>
  );
};

export default Map;
