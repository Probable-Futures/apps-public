import React from "react";
import { TooltipProps } from "recharts";

const CustomTooltip = (
  prop: TooltipProps<number, string> & {
    xLabel: string;
    yLabel: string;
    degree: number;
  },
) => {
  const { active, payload, yLabel, xLabel } = prop;

  if (active && payload && payload.length) {
    const payloadAtDegree = payload.find((p) => parseFloat(p.name || "") === prop.degree);
    if (!payloadAtDegree) {
      return null;
    }
    return (
      <div
        style={{
          padding: "13px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "#d1d5db",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
        className="pf-chart-tooltip-wrapper"
      >
        <div>
          {`Up to ${payloadAtDegree.payload.x} ${xLabel} - ${yLabel} ${payloadAtDegree.payload.y}%`}
        </div>
        <div>
          {`At least ${payloadAtDegree.payload.x} ${xLabel} - ${yLabel} ${
            100 - payloadAtDegree.payload.y
          }%`}
        </div>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
