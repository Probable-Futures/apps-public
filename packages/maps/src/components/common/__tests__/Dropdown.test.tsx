import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dropdown from "../Dropdown";

vi.mock("../../../assets/icons/caret-up.svg", () => ({ ReactComponent: () => null, default: "" }));

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

describe("Dropdown", () => {
  it("renders the currently selected value", () => {
    render(<Dropdown value={options[0]} options={options} onChange={() => {}} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });

  it("shows all options after opening the menu", async () => {
    const user = userEvent.setup();
    render(<Dropdown value={options[0]} options={options} onChange={() => {}} />);
    await user.click(screen.getByText("Option A"));
    expect(await screen.findByText("Option B")).toBeInTheDocument();
  });

  it("fires onChange with the selected option object", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown value={options[0]} options={options} onChange={onChange} />);
    await user.click(screen.getByText("Option A"));
    await user.click(await screen.findByText("Option B"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: "b" }));
  });
});
