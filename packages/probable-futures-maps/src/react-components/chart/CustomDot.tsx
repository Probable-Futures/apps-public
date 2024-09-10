import React from "react";
import { Dot } from "recharts";

const CustomDot = (props: any) => {
  const { cx, cy, payload, onClick, r, strokeWidth, opacity, stroke } = props;

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={r}
      strokeWidth={strokeWidth}
      fill="#fff"
      opacity={opacity}
      stroke={stroke}
      clipDot
      onClick={() => onClick(payload)}
      cursor={"pointer"}
    />
  );
};

export default CustomDot;
