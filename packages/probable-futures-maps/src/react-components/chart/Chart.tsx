import React, { useCallback, useMemo } from "react";
import { XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

import CustomTooltip from "./CustomTooltip";
import YLabel from "./YLabel";
import XLabel from "./XLabel";
import CustomDot from "./CustomDot";
import { StatisticsData } from "@probable-futures/lib/src/types";
import { getMapObject } from "../..";

type ChartProps = {
  width: number;
  height: number;
  datasetStats?: StatisticsData[];
  datasetId: number;
  warmingScenario: number;
  hideTitle?: boolean;
  onLineClicked: (scenario: number) => void;
};

const Chart = ({
  width,
  height,
  datasetStats = [],
  warmingScenario,
  datasetId,
  hideTitle,
  onLineClicked,
}: ChartProps) => {
  /**
   * if one x value has multiple likelihood values, select only one point(x, y) such that
   * y is the max likelihood for x
   **/
  const mapObject = getMapObject(datasetId);
  if (!mapObject) {
    throw Error("Invalid datasetId.");
  }

  const selectMaxYForX = useCallback((stat: StatisticsData) => {
    const map = new Map<number, number>();
    stat.cumulativeProbability.forEach((y, index) => {
      const x = stat!.values[index];
      if (!map.has(x) || y > map.get(x)!) {
        map.set(x, y);
      }
    });

    return Array.from(map, ([x, y]) => ({ x, y }));
  }, []);

  const data = useMemo(() => {
    return datasetStats.map((dst) => ({
      name: dst.name + " at " + dst.warmingScenario,
      data: selectMaxYForX({
        ...dst,
        cumulativeProbability: Array.from({ length: 101 }, (_, i) => i),
      }),
      degree: dst.warmingScenario,
    }));
  }, [datasetStats, selectMaxYForX]);

  const minLikelihood = 0,
    maxLikelihood = 100;

  const minX = useMemo(() => {
    return (
      datasetStats.reduce((prev, cur) => {
        prev = Math.round(Math.min(prev, Math.min(...cur.values)));
        return prev;
      }, Number.MAX_VALUE) || 0
    );
  }, [datasetStats]);

  const maxX = useMemo(() => {
    return (
      datasetStats.reduce((prev, cur) => {
        prev = Math.ceil(Math.max(prev, Math.max(...cur.values)));
        return prev;
      }, Number.MIN_SAFE_INTEGER) || 0
    );
  }, [datasetStats]);

  const onLineClick = (degree: string) => {
    onLineClicked(parseFloat(degree));
  };

  return (
    <div
      style={{
        marginTop: "2rem",
        marginBottom: "2rem",
      }}
    >
      <>
        {!hideTitle && (
          <label>
            Likelihood of {mapObject.name} in a {warmingScenario}°C warming scenario
          </label>
        )}
        <LineChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
          desc="Likelihood of days above 32°c occurrence"
          width={width}
          height={height}
          title=""
          defaultShowTooltip={false}
        >
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            name={mapObject.name}
            unit={mapObject.dataset.unit}
            label={<XLabel name={mapObject.name} width={width} height={height} />}
            domain={[minX, maxX]}
            allowDecimals={false}
            allowDuplicatedCategory={false}
            tickMargin={10}
            height={70}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="likelihood"
            unit="%"
            label={<YLabel height={height} />}
            domain={[minLikelihood, maxLikelihood]}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <CustomTooltip
                xLabel={mapObject.dataset.unit}
                yLabel="likelihood"
                degree={warmingScenario}
              />
            }
          />

          {data.map((dataset, index) => {
            const isActive = parseFloat(dataset.degree) === warmingScenario;
            return (
              <Line
                key={index}
                type="linear"
                dataKey="y"
                data={dataset.data}
                stroke={isActive ? "rgb(136, 132, 216)" : "rgba(136, 132, 216, 0.4)"}
                name={dataset.degree}
                {...(!isActive && {
                  tooltipType: "none",
                  onClick: () => {
                    onLineClick(dataset.degree);
                  },
                })}
                activeDot={isActive ? { r: 6 } : false}
                dot={<CustomDot onClick={() => onLineClick(dataset.degree)} />}
                opacity={isActive ? 1 : 0.9}
                strokeWidth={isActive ? 2 : 1}
                isAnimationActive={false}
                cursor={!isActive ? "pointer" : "default"}
              />
            );
          })}
        </LineChart>
      </>
    </div>
  );
};

export default Chart;
