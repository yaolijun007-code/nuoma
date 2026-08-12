export type WorkflowStatus = "new" | "verified" | "referred" | "closed";

export interface AdminListItem {
  confirmationId: string;
  submittedAt: string;
  hasRedFlag: boolean;
  status?: WorkflowStatus;
  [key: string]: unknown;
}

export interface AdminRepository {
  list(limit: number): Promise<AdminListItem[]>;
  detail(confirmationId: string): Promise<unknown>;
  updateStatus(confirmationId: string, status: WorkflowStatus, adminUid: string): Promise<void>;
}

export class AdminAuthorizationError extends Error {}

const statuses = new Set<WorkflowStatus>(["new", "verified", "referred", "closed"]);

export function createAdminService(repository: AdminRepository, allowedUids: Set<string>) {
  const authorize = (uid: string) => {
    if (!uid || !allowedUids.has(uid)) throw new AdminAuthorizationError("无权访问健康管理数据");
  };

  return {
    async list(uid: string, requestedLimit = 20) {
      authorize(uid);
      const limit = Math.max(1, Math.min(50, Number(requestedLimit) || 20));
      const records = await repository.list(limit);
      return [...records].sort((a, b) => Number(b.hasRedFlag) - Number(a.hasRedFlag) || b.submittedAt.localeCompare(a.submittedAt));
    },
    async detail(uid: string, confirmationId: string) {
      authorize(uid);
      if (!/^JS-[A-Z0-9-]+$/.test(confirmationId)) throw new Error("确认编号无效");
      return repository.detail(confirmationId);
    },
    async updateStatus(uid: string, confirmationId: string, status: string) {
      authorize(uid);
      if (!statuses.has(status as WorkflowStatus)) throw new Error("处理状态无效");
      await repository.updateStatus(confirmationId, status as WorkflowStatus, uid);
    },
  };
}

