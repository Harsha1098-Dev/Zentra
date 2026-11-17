import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TenantContext } from '../src/common/context/tenant-context';
import { TenantContextInterceptor } from '../src/common/interceptors/tenant-context.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('PostgreSQL Row-Level Security & Tenant Context', () => {
  let interceptor: TenantContextInterceptor;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prismaService = {
      setTenantContext: jest.fn().mockResolvedValue(undefined),
      withTenant: jest.fn(),
      $executeRaw: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn(),
    } as any;

    interceptor = new TenantContextInterceptor(prismaService);
  });

  describe('TenantContext (AsyncLocalStorage)', () => {
    it('stores and retrieves organizationId and userId within execution scope', (done) => {
      const orgId = '11111111-1111-1111-1111-111111111111';
      const userId = 'user-abc';

      TenantContext.run({ organizationId: orgId, userId }, () => {
        expect(TenantContext.getOrganizationId()).toBe(orgId);
        expect(TenantContext.getUserId()).toBe(userId);
        done();
      });
    });

    it('returns null when accessed outside any tenant context execution', () => {
      expect(TenantContext.getOrganizationId()).toBeNull();
      expect(TenantContext.getUserId()).toBeNull();
    });

    it('isolates different concurrent asynchronous context scopes', (done) => {
      const orgA = 'org-tenant-alpha';
      const orgB = 'org-tenant-beta';

      let finishedA = false;
      let finishedB = false;

      TenantContext.run({ organizationId: orgA }, async () => {
        await new Promise((r) => setTimeout(r, 20));
        expect(TenantContext.getOrganizationId()).toBe(orgA);
        finishedA = true;
        if (finishedA && finishedB) done();
      });

      TenantContext.run({ organizationId: orgB }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        expect(TenantContext.getOrganizationId()).toBe(orgB);
        finishedB = true;
        if (finishedA && finishedB) done();
      });
    });
  });

  describe('TenantContextInterceptor', () => {
    it('propagates authenticated user organizationId to TenantContext and Prisma setTenantContext', (done) => {
      const orgId = 'e8d2c1a4-0000-0000-0000-000000000000';
      const userId = 'user-test-id';

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: userId,
              organizationId: orgId,
            },
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: () => {
          // Verify that inside the handler, TenantContext has the correct tenant
          expect(TenantContext.getOrganizationId()).toBe(orgId);
          expect(TenantContext.getUserId()).toBe(userId);
          return of({ success: true });
        },
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (res) => {
          expect(res).toEqual({ success: true });
          expect(prismaService.setTenantContext).toHaveBeenCalledWith(orgId);
          done();
        },
      });
    });

    it('handles unauthenticated or public requests without active organization safely', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: undefined,
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: () => {
          expect(TenantContext.getOrganizationId()).toBeNull();
          return of({ data: 'public' });
        },
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (res) => {
          expect(res).toEqual({ data: 'public' });
          expect(prismaService.setTenantContext).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('PrismaService withTenant helper', () => {
    it('sets app.current_organization_id inside transaction and returns query callback result', async () => {
      const actualPrisma = new PrismaService();
      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        location: {
          findMany: jest.fn().mockResolvedValue([{ id: 'loc-1', name: 'HQ' }]),
        },
      };

      jest.spyOn(actualPrisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const result = await actualPrisma.withTenant('org-uuid-999', async (tx: any) => {
        return tx.location.findMany();
      });

      expect(mockTx.$executeRaw).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'loc-1', name: 'HQ' }]);
    });
  });
});
