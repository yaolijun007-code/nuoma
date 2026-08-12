import { describe, expect, it, vi } from "vitest";
import { AdminAuthorizationError, createAdminService } from "./admin";

describe("admin service", () => {
  it("rejects missing or unapproved user ids", async () => {
    const service = createAdminService({ list: vi.fn(), detail: vi.fn(), updateStatus: vi.fn() }, new Set(["admin-1"]));
    await expect(service.list("", 20)).rejects.toBeInstanceOf(AdminAuthorizationError);
    await expect(service.list("visitor", 20)).rejects.toBeInstanceOf(AdminAuthorizationError);
  });

  it("places medical red flags before normal records", async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([
        { confirmationId: "B", hasRedFlag: false, submittedAt: "2026-08-13T09:00:00Z" },
        { confirmationId: "A", hasRedFlag: true, submittedAt: "2026-08-13T08:00:00Z" },
      ]),
      detail: vi.fn(), updateStatus: vi.fn(),
    };
    const service = createAdminService(repository, new Set(["admin-1"]));
    expect((await service.list("admin-1", 20))[0].confirmationId).toBe("A");
  });

  it("allows only known workflow statuses", async () => {
    const updateStatus = vi.fn();
    const service = createAdminService({ list: vi.fn(), detail: vi.fn(), updateStatus }, new Set(["admin-1"]));
    await expect(service.updateStatus("admin-1", "JS-1", "deleted")).rejects.toThrow("处理状态无效");
    await service.updateStatus("admin-1", "JS-1", "verified");
    expect(updateStatus).toHaveBeenCalledWith("JS-1", "verified", "admin-1");
  });
});

