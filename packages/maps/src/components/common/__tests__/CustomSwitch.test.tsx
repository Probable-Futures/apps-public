import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomSwitch from "../CustomSwitch";

describe("CustomSwitch", () => {
  it("renders the label text", () => {
    render(<CustomSwitch name="toggle" label="Enable feature" checked={false} onChange={() => {}} />);
    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("reflects checked state on the input", () => {
    render(<CustomSwitch name="toggle" label="Label" checked={true} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("fires onChange with the new boolean value when clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CustomSwitch name="toggle" label="Label" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
