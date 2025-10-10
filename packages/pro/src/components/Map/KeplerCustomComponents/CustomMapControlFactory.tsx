import { useMapData } from "../../../contexts/DataContext";
import { useAppSelector } from "../../../app/hooks";
import { MAP_ID } from "../../../consts/MapConsts";
import useShareProjectApi from "../../../utils/useShareProjectApi";
import MapKey from "../MapKey";

function CustomMapControlFactory() {
  const CustomMapConrol = () => {
    const { projectSharedData } = useShareProjectApi();
    const { selectedClimateData, tempUnit, precipitationUnit, setPrecipitationUnit, setTempUnit } =
      useMapData();

    const bins =
      useAppSelector((state) => state.project.mapConfig?.pfMapConfig?.bins) ||
      selectedClimateData?.stops;

    const activeSidePanel = useAppSelector(
      (state) => state.keplerGl[MAP_ID]?.uiState.activeSidePanel,
    );

    const slugId = useAppSelector((state) => state.project.slugId);

    const isSharedProject = !!projectSharedData;

    return (
      <MapKey
        activeSidePanel={!!activeSidePanel}
        isSharedProject={isSharedProject}
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
