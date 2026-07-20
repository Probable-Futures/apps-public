import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Map } from "@probable-futures/lib";

import DatasetSelector from "@probable-futures/components-lib/src/components/header/DatasetSelector";

const selectedMap = {
  value: "days_above_32c",
  label: "Days above 32°C (90°F)",
};

const datasets = [
  {
    isLatest: true,
    slug: selectedMap.value,
    name: selectedMap.label,
    dataset: {
      subCategory: "increasing heat",
      pfDatasetParentCategoryByParentCategory: {
        label: "Maps of temperature",
      },
    },
  },
] as Map[];

const DatasetSelectorHarness = () => {
  const [selectMode, setSelectMode] = useState(false);

  return (
    <DatasetSelector
      value={selectedMap}
      datasets={datasets}
      selectMode={selectMode}
      setSelectMode={setSelectMode}
    />
  );
};

describe("DatasetSelector", () => {
  afterEach(() => vi.useRealTimers());

  it("does not reanimate the unchanged title when toggled", () => {
    vi.useFakeTimers();
    render(<DatasetSelectorHarness />);

    act(() => vi.advanceTimersByTime(400));

    const title = screen.getByText("Select a map");
    const titleClassName = title.className;

    fireEvent.click(title);

    expect(title.className).toBe(titleClassName);
  });
});
