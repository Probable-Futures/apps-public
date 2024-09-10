import React from "react";

type Props = {
  name?: string;
  width: number;
  height: number;
};

const XLabel = ({ name, width, height }: Props) => {
  if (!name) {
    return null;
  }
  const xPos = width / 2;
  const yPos = height - 20;
  return (
    <text
      offset="5"
      x={xPos}
      y={yPos}
      className="recharts-text recharts-label"
      text-anchor="middle"
      fill="#808080"
    >
      <tspan x={xPos} dy="0.355em">
        {name}
      </tspan>
    </text>
  );
};

export default XLabel;
