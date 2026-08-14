import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionPage } from "./QuestionPage";

describe("QuestionPage accessibility", () => {
  it("associates helper and error text with an identity input", () => {
    render(<QuestionPage
      question={{ id: "test-name", prompt: "姓名", type: "text", required: true, helper: "仅用于记录匹配" }}
      value=""
      error="请填写姓名"
      date="2026-08-14"
      onChange={vi.fn()}
      onContinue={vi.fn()}
      onAutoAdvance={vi.fn()}
    />);
    const input = screen.getByRole("textbox", { name: "姓名" });
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("test-name-error");
    expect(input.getAttribute("aria-describedby")).toContain("test-name-helper");
  });
});
