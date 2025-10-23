import React, { useMemo } from "react";
import styled from "styled-components";
import {
  MapPopoverFactory,
  LayerHoverInfoFactory,
  appInjector,
  MapPopoverContentFactory,
} from "@kepler.gl/components";
import { consts } from "@probable-futures/lib";
import { MapPopoverProps } from "@kepler.gl/components/dist/map/map-popover";
import { LayerHoverProp } from "@kepler.gl/reducers";

import { useMapData } from "../../../contexts/DataContext";
import TooltipFeature from "../TooltipFeature";
import { EmptyFactory } from "../../Common";
import { getFeature } from "../../../utils/useFeaturePopup";
import { useAppSelector } from "../../../app/hooks";

const LayerHoverInfoWrapper = styled.div`
  margin-bottom: 11.5px;
`;

type MapPopoverContentProps = {
  coordinate: [number, number] | boolean;
  layerHoverProp: LayerHoverProp | null;
  zoom: number;
};

const CustomLayerHoverInfoFactory = () => {
  const LayerHoverInfo = appInjector.get(LayerHoverInfoFactory);

  const CustomLayerHoverInfo = (...props: any) => {
    const { mapRef, selectedClimateData } = useMapData();
    const degrees = useAppSelector((state) => state.project.mapConfig.pfMapConfig.warmingScenario);
    const [{ dataKey }] = consts.degreesOptions.filter((d) => d.value === degrees);
    const coordinate = props[0].coordinate as Array<number>; // dynamic coordinates based on mouse position on the screen

    // Try to find original coordinate of the point, and then use mapBoxMap.project to get XY which the screen coordinates,
    // that are required by the queryRenderedFeatures function to get the features of a specific point.
    const lonIndex = props[0]?.fields?.find(
      (field: any) =>
        field.name === "lon" ||
        field.name === "lng" ||
        field.name === "long" ||
        field.name === "longitude",
    )?.fieldIdx;
    const latIndex = props[0]?.fields?.find(
      (field: any) => field.name === "lat" || field.name === "latitude",
    )?.fieldIdx;
    if (!isNaN(lonIndex) && !isNaN(latIndex)) {
      const data = props[0].data;
      if (data) {
        const originalCoordinate = data._dataContainer?._rows[data._rowIndex]; // real coordinate from the original file
        if (
          originalCoordinate?.length > 0 &&
          !isNaN(originalCoordinate[lonIndex]) &&
          !isNaN(originalCoordinate[latIndex])
        ) {
          coordinate[0] = originalCoordinate[lonIndex];
          coordinate[1] = originalCoordinate[latIndex];
        }
      }
    }

    const climateData = useMemo(() => {
      if (mapRef.current) {
        const mapBoxMap = mapRef.current.getMap();
        const coordinatePixels = mapBoxMap.project(coordinate);
        if (coordinatePixels && coordinatePixels.x && coordinatePixels.y) {
          const features = mapBoxMap.queryRenderedFeatures([
            coordinatePixels.x,
            coordinatePixels.y,
          ]);
          const feature = getFeature(
            features,
            coordinate[0],
            coordinate[1],
            coordinatePixels.x,
            coordinatePixels.y,
            dataKey,
          );
          return (
            feature && (
              <TooltipFeature
                feature={feature}
                dataset={selectedClimateData}
                degreesOfWarming={degrees}
              />
            )
          );
        }
      }
      return <></>;
    }, [mapRef, coordinate, dataKey, degrees, selectedClimateData]);

    return (
      <>
        <LayerHoverInfoWrapper>
          <LayerHoverInfo {...props[0]} />
        </LayerHoverInfoWrapper>
        {climateData}
      </>
    );
  };

  return CustomLayerHoverInfo;
};

const CustomMapPopoverContentFactory = (...deps: Parameters<typeof MapPopoverContentFactory>) => {
  const MapPopoverContent = MapPopoverContentFactory(...deps);

  const CustomMapPopoverContent = (props: MapPopoverContentProps) => {
    const propsWithCoordinate = {
      ...props,
      layerHoverProp: props.layerHoverProp
        ? {
            ...props.layerHoverProp,
            coordinate: props.coordinate,
          }
        : null,
    };

    return props.coordinate ? <MapPopoverContent {...propsWithCoordinate} /> : null;
  };

  return CustomMapPopoverContent;
};

CustomMapPopoverContentFactory.deps = [CustomLayerHoverInfoFactory, () => EmptyFactory()];

function CustomMapPopoverFactory(...deps: Parameters<typeof MapPopoverFactory>) {
  const MapPopover = MapPopoverFactory(...deps);
  const CustomMapPopover = (props: MapPopoverProps) => {
    // when a point is clicked froze the tooltip in the middle of the page to the right
    const [x, y] = props.frozen ? [window.innerWidth + 10, 100] : [props.x, props.y];
    const propsWithCoordinate = {
      ...props,
      x,
      y,
    };

    return props.coordinate ? <MapPopover {...propsWithCoordinate} /> : null;
  };
  return CustomMapPopover;
}

CustomMapPopoverFactory.deps = [CustomMapPopoverContentFactory];

export default CustomMapPopoverFactory;
