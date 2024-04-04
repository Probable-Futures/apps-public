import { useState, useEffect } from "react";

function measureHeight(): number | null {
  return document.documentElement?.clientHeight || window.innerHeight;
}

export function useWindowHeight() {
  const [height, setHeight] = useState<number | null>(measureHeight);
  useEffect(() => {
    function setMeasuredHeight() {
      const measuredHeight = measureHeight();
      setHeight(measuredHeight);
    }
    window.addEventListener("resize", setMeasuredHeight);
    return () => window.removeEventListener("resize", setMeasuredHeight);
  }, []);
  return height;
}
