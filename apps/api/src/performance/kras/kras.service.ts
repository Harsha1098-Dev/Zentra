import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { KrasRepository } from './kras.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class KrasService {
  constructor(
    private readonly repository: KrasRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, employeeId?: string, userId?: string, roles: string[] = []) {
    if (roles.includes('EMPLOYEE') && !roles.includes('SUPER_ADMIN') && !roles.includes('HR_ADMIN') && !roles.includes('MANAGER')) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) employeeId = emp.id;
    }
    return this.repository.findAll(organizationId, employeeId);
  }

  async findById(id: string, organizationId: string) {
    const kra = await this.repository.findById(id, organizationId);
    if (!kra) {
      throw new NotFoundException(`KRA '${id}' not found`);
    }
    return kra;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    let employeeId = data.employeeId;
    if (!employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (!emp) {
        throw new BadRequestException('No employee record found for user to assign KRA');
      }
      employeeId = emp.id;
    }

    if (data.weightage !== undefined && (data.weightage < 0 || data.weightage > 100)) {
      throw new BadRequestException('KRA weightage must be between 0 and 100');
    }

    const kra = await this.repository.create(
      organizationId,
      { ...data, employeeId },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KRA_CREATE,
      resource: 'kras',
      resourceId: kra.id,
      details: { title: kra.title, employeeId: kra.employeeId, category: kra.category },
      ipAddress: ip,
      userAgent: ua,
    });

    return kra;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);

    if (data.weightage !== undefined && (data.weightage < 0 || data.weightage > 100)) {
      throw new BadRequestException('KRA weightage must be between 0 and 100');
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KRA_UPDATE,
      resource: 'kras',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async delete(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const deleted = await this.repository.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KRA_DELETE,
      resource: 'kras',
      resourceId: id,
      details: { deleted: true },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }
}
