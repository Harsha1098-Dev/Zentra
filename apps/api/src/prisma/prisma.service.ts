import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '../common/context/tenant-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Sets app.current_organization_id for a given client or transaction.
   */
  async setTenantContext(organizationId: string | null, client?: Prisma.TransactionClient): Promise<void> {
    const target = client || this;
    const orgId = organizationId || '';
    await target.$executeRaw`SELECT set_config('app.current_organization_id', ${orgId}, true)`;
  }

  /**
   * Executes a callback within a database transaction scoped with app.current_organization_id.
   */
  async withTenant<T>(
    organizationId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_organization_id', ${organizationId}, true)`;
      return callback(tx);
    });
  }
}
