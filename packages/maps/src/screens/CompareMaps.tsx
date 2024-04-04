import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
// @ts-ignore
import Compare from "mapbox-gl-compare";
import styled from "styled-components";
import { getBinLabel } from "@probable-futures/lib/src/utils";
import { MIN_ZOOM } from "@probable-futures/lib/src/consts";

import { colors } from "../consts";
import ArrowLeftIcon from "../assets/icons/arrow-left.svg";
import ArrowRightIcon from "../assets/icons/arrow-right.svg";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

const Container = styled.div`
  height: 100vh;
  overflow: auto;
  background-color: ${colors.dimBlack};
`;

const Content = styled.div`
  max-width: 1102px;
  margin: 0 auto;
  padding-top: 50px;
  padding-bottom: 47px;
`;

const Title = styled.h1`
  color: ${colors.white};
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0;
  margin: 0;
  margin-bottom: 50px;
`;

const MapContainer = styled.div`
  position: relative;
  user-select: none;
  height: 570px;
  margin-bottom: 38px;

  .mapboxgl-compare {
    background-color: ${colors.darkPurple};
    position: absolute;
    width: 2px;
    height: 100%;
    z-index: 1;
  }

  .mapboxgl-compare .compare-swiper-vertical {
    background-color: ${colors.darkPurple};
    box-shadow: inset 0 0 0 2px ${colors.white};
    display: inline-block;
    border-radius: 50%;
    position: absolute;
    width: 40px;
    height: 40px;
    top: 50%;
    left: -20px;
    margin: -20px 1px 0;
    color: ${colors.white};
    cursor: ew-resize;
    background-image: url(${ArrowLeftIcon}), url(${ArrowRightIcon});
    background-repeat: no-repeat, no-repeat;
    background-size: 12px auto;
    background-position: 7px, 21px;

    ::before,
    ::after {
      font-family: "RelativeMono";
      background-color: ${colors.darkPurple};
      border: 1px solid ${colors.white};
      display: block;
      position: absolute;
      top: 10px;
      padding: 2px 0;
      width: 62px;
      text-align: center;
      color: ${colors.lightCream};
      font-size: 15px;
      letter-spacing: 0;
    }

    ::before {
      content: "0.5°C";
      left: -71px;
    }

    ::after {
      font-family: "RelativeMono";
      content: "3°C";
      right: -71px;
    }
  }
`;

const Map = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
`;

const Label = styled.span`
  position: absolute;
  top: 21px;
  z-index: 1;
  background-color: ${colors.white};
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
`;

const BeforeLabel = styled(Label)`
  left: 21px;
`;

const AfterLabel = styled(Label)`
  right: 21px;
`;

const BinsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const KeyTitle = styled.span`
  display: block;
  font-size: 10px;
  color: ${colors.white};
  line-height: 29px;
  margin-bottom: 15px;
  font-size: 18px;
  letter-spacing: 0;
  line-height: 29px;
`;

const BinContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Color = styled.div`
  height: 14px;
  width: 65px;
  background-color: ${({ value }: { value: string }) => value};
  margin-right: 3px;
`;

const Bin = styled.span`
  font-family: "RelativeMono";
  color: ${colors.white};
  font-size: 13px;
  letter-spacing: 0;
  line-height: 16px;
  text-align: center;
  margin-top: 4px;
`;

export default function CompareMaps(): JSX.Element {
  const mapContainer = useRef(null);
  const beforeContainer = useRef(null);
  const afterContainer = useRef(null);

  useEffect(() => {
    const navControls = new mapboxgl.NavigationControl({
      showCompass: false,
    });

    const beforeMap = new mapboxgl.Map({
      container: beforeContainer.current || "",
      style: "mapbox://styles/probablefutures/ckp719noh0kq017kjgnx384vc",
      minZoom: MIN_ZOOM,
    });

    const afterMap = new mapboxgl.Map({
      container: afterContainer.current || "",
      style: "mapbox://styles/probablefutures/ckna63myn0p3817mr9sqoigt2",
      minZoom: MIN_ZOOM,
    });
    afterMap.addControl(navControls, "bottom-right");

    const map = new Compare(beforeMap, afterMap, mapContainer.current);

    return () => map.remove();
  }, []);

  const bins = [1, 8, 31, 91, 181, 365];
  const binHexColors = ["#515866", "#0ed5a3", "#0099e4", "#8be1ff", "#ff45d0", "#d70066"];

  return (
    <Container>
      <Content>
        <Title>Days over 32°C (90°F)</Title>
        <MapContainer ref={mapContainer}>
          <BeforeLabel>Warming scenario: 0.5°C</BeforeLabel>
          <Map ref={beforeContainer} />
          <AfterLabel>Warming scenario: 3°C</AfterLabel>
          <Map ref={afterContainer} />
        </MapContainer>
        <KeyTitle>Number of days over 32°C (90°F)</KeyTitle>
        <BinsContainer>
          {binHexColors.map((color: string, index: number) => {
            const [from, to] = getBinLabel(bins, index, "number of days", 0, bins[bins.length], 1);
            return (
              <BinContainer key={color}>
                <Color value={color} />
                <Bin>
                  {from}
                  {to !== undefined && <span>-{to}</span>}
                </Bin>
              </BinContainer>
            );
          })}
        </BinsContainer>
      </Content>
    </Container>
  );
}
