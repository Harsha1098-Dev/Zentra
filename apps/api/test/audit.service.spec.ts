import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../src/audit/audit.service';
import { AuditRepository } from '../src/audit/audit.repository';
import { AuditAction } from '@zentra/shared-types';

describe('AuditService', () => {
  let auditService: AuditService;
  let auditRepo: jest.Mocked<AuditRepository>;

  beforeEach(async () => {
    const mockAuditRepo = {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'audit-log-id', ...data })),
      findByOrganization: jest.fn(),
      countByOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: mockAuditRepo },
      ],
    }).compile();

    auditService = module.get(AuditService);
    auditRepo = module.get(AuditRepository);
  });

  it('redacts sensitive fields such as password, token, and secret before saving', async () => {
    await auditService.log({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      action: AuditAction.USER_REGISTER,
      entityType: 'User',
      entityId: 'user-1',
      oldValues: {
        password: 'PlainTextPassword123',
        token: 'secret_token_12345',
        safeData: 'safe_value',
      },
      newValues: {
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
        refreshToken: 'refresh_secret_abc',
        email: 'user@example.com',
      },
    });

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        oldValues: {
          password: '[REDACTED]',
          token: '[REDACTED]',
          safeData: 'safe_value',
        },
        newValues: {
          passwordHash: '[REDACTED]',
          refreshToken: '[REDACTED]',
          email: 'user@example.com',
        },
      }),
    );
  });
});
