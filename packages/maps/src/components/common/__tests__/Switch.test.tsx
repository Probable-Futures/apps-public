import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Switch from "../Switch";

describe("Switch", () => {
  it("renders left and right option labels", () => {
    render(<Switch isChecked={false} left="Off" right="On" onChange={() => {}} />);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.getByText("On")).toBeInTheDocument();
  });

  it("fires onChange when the label is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch isChecked={false} left="Off" right="On" onChange={onChange} />);
    await user.click(screen.getByRole("checkbox", { hidden: true }));
    expect(onChange).toHaveBeenCalled();
  });
});
