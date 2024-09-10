import React from "react";

type Props = {
  height: number;
};

const YLabel = ({ height }: Props) => {
  const xPos = 20;
  const yPos = height / 2 - 30;

  return (
    <text
      transform={`rotate(-90, ${xPos}, ${yPos})`}
      x={xPos}
      y={yPos}
      className="recharts-text recharts-label"
      textAnchor="middle"
      fill="#808080"
    >
      <tspan x={xPos} dy="0.355em">
        Likelihood
      </tspan>
    </text>
  );
};

export default YLabel;
