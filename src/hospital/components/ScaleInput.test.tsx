import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScaleInput } from "./ScaleInput";

describe("ScaleInput", () => {
  it("offers an accessible 0 to 10 health scale", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ScaleInput value={undefined} onChange={onChange} />);
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    await user.click(screen.getByRole("radio", { name: "8分" }));
    expect(onChange).toHaveBeenCalledWith(8);
  });
});
