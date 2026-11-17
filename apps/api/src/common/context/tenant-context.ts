import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  organizationId: string | null;
  userId?: string | null;
}

export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantContextData>();

  static run<T>(data: TenantContextData, fn: () => T): T {
    return this.storage.run(data, fn);
  }

  static getOrganizationId(): string | null {
    return this.storage.getStore()?.organizationId || null;
  }

  static getUserId(): string | null {
    return this.storage.getStore()?.userId || null;
  }
}
