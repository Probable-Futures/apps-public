import { useMapData } from "../../../contexts/DataContext";
import { useAppSelector } from "../../../app/hooks";
import { MAP_ID } from "../../../consts/MapConsts";
import MapKey from "../MapKey";

function CustomMapControlFactory() {
  const CustomMapConrol = () => {
    const { selectedClimateData, tempUnit, precipitationUnit, setPrecipitationUnit, setTempUnit } =
      useMapData();
    const bins =
      useAppSelector((state) => state.project.mapConfig?.pfMapConfig?.bins) ||
      selectedClimateData?.stops;
    const activeSidePanel = useAppSelector(
      (state) => state.keplerGl[MAP_ID]?.uiState.activeSidePanel,
    );
    const slugId = useAppSelector((state) => state.project.slugId);

    return (
      <MapKey
        activeSidePanel={!!activeSidePanel}
        slugId={slugId}
        bins={bins}
        tempUnit={tempUnit}
        setTempUnit={setTempUnit}
        precipitationUnit={precipitationUnit}
        setPrecipitationUnit={setPrecipitationUnit}
      />
    );
  };

  return CustomMapConrol;
}

export default CustomMapControlFactory;
