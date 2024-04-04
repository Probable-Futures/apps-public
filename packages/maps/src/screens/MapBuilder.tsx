import Map from "../components/Maps/MapBuilder";
import { MenuProvider, Sidebar } from "../components/Menu";

export default function MapBuilder(): JSX.Element {
  return (
    <MenuProvider>
      <Sidebar />
      <Map />
    </MenuProvider>
  );
}
