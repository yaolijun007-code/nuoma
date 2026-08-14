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
    expect(screen.getByRole("group", { name: "整体健康状态评分" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "8分" }));
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it("announces a missing score and focuses the first option", () => {
    render(<ScaleInput value={undefined} onChange={vi.fn()} error="请选择一项" errorId="f55-error" />);
    const group = screen.getByRole("group", { name: "整体健康状态评分" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute("aria-describedby", "f55-error");
    expect(screen.getByRole("alert")).toHaveTextContent("请选择一项");
    expect(screen.getByRole("radio", { name: "0分" })).toHaveFocus();
  });
});
