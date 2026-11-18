import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssetsRepository } from './assets.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  AssetReturnStatus,
  AssetCondition,
} from '@zentra/shared-types';

@Injectable()
export class AssetsService {
  constructor(
    private readonly repository: AssetsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    organizationId: string,
    filters: { status?: string; employeeId?: string; assetType?: string } = {},
  ) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const asset = await this.repository.findById(id, organizationId);
    if (!asset) {
      throw new NotFoundException(`Asset '${id}' not found`);
    }
    return asset;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    // Check serial uniqueness
    const existing = await this.prisma.asset.findFirst({
      where: {
        organizationId,
        assetSerialNumber: data.assetSerialNumber,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Asset with serial number '${data.assetSerialNumber}' already exists in this organization`,
      );
    }

    if (data.assignedEmployeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: data.assignedEmployeeId, organizationId, deletedAt: null },
      });
      if (!employee) {
        throw new NotFoundException(`Employee '${data.assignedEmployeeId}' not found`);
      }
    }

    const asset = await this.repository.create(organizationId, data, userId);

    if (data.assignedEmployeeId) {
      await this.prisma.employmentHistory.create({
        data: {
          organizationId,
          employeeId: data.assignedEmployeeId,
          eventType: 'ASSET_ASSIGNED',
          effectiveFrom: new Date(),
          remarks: `Assigned asset: ${asset.assetName} (Serial: ${asset.assetSerialNumber})`,
          newValues: { assetId: asset.id, assetType: asset.assetType },
          changedByUserId: userId,
        },
      });
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ASSET_CREATE,
      resource: 'assets',
      resourceId: asset.id,
      details: {
        assetName: asset.assetName,
        assetSerialNumber: asset.assetSerialNumber,
        assignedEmployeeId: asset.assignedEmployeeId,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return asset;
  }

  async update(
    id: string,
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ASSET_UPDATE,
      resource: 'assets',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async assign(
    id: string,
    organizationId: string,
    data: { employeeId: string; assignedDate?: string; comments?: string },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const asset = await this.findById(id, organizationId);
    if (asset.returnStatus === AssetReturnStatus.ASSIGNED) {
      throw new BadRequestException('Asset is already currently assigned to an employee');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    const assignedDate = data.assignedDate ? new Date(data.assignedDate) : new Date();

    const updated = await this.repository.update(id, organizationId, {
      assignedEmployeeId: employee.id,
      assignedDate,
      returnDate: null,
      returnStatus: AssetReturnStatus.ASSIGNED,
      assignedBy: userId,
      comments: data.comments
        ? `${asset.comments || ''}\n[Assigned ${assignedDate.toLocaleDateString()}]: ${data.comments}`.trim()
        : asset.comments,
    });

    await this.prisma.employmentHistory.create({
      data: {
        organizationId,
        employeeId: employee.id,
        eventType: 'ASSET_ASSIGNED',
        effectiveFrom: assignedDate,
        remarks: `Assigned asset: ${asset.assetName} (Serial: ${asset.assetSerialNumber})`,
        newValues: { assetId: asset.id, assetType: asset.assetType },
        changedByUserId: userId,
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ASSET_ASSIGN,
      resource: 'assets',
      resourceId: id,
      details: { employeeId: employee.id, assignedDate },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async returnAsset(
    id: string,
    organizationId: string,
    data: { returnCondition: string; returnDate?: string; comments?: string },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const asset = await this.findById(id, organizationId);
    if (asset.returnStatus !== AssetReturnStatus.ASSIGNED || !asset.assignedEmployeeId) {
      throw new BadRequestException('Asset is not currently assigned');
    }

    const returnDate = data.returnDate ? new Date(data.returnDate) : new Date();
    const previousEmployeeId = asset.assignedEmployeeId;

    const updated = await this.repository.update(id, organizationId, {
      returnDate,
      returnStatus: AssetReturnStatus.RETURNED,
      assetCondition: data.returnCondition || AssetCondition.GOOD,
      assignedEmployeeId: null,
      comments: data.comments
        ? `${asset.comments || ''}\n[Returned ${returnDate.toLocaleDateString()} condition ${data.returnCondition}]: ${data.comments}`.trim()
        : asset.comments,
    });

    await this.prisma.employmentHistory.create({
      data: {
        organizationId,
        employeeId: previousEmployeeId,
        eventType: 'ASSET_RETURNED',
        effectiveFrom: returnDate,
        remarks: `Returned asset: ${asset.assetName} (Serial: ${asset.assetSerialNumber}) in condition ${data.returnCondition}.`,
        newValues: {
          assetId: asset.id,
          condition: data.returnCondition,
          returnDate: returnDate.toISOString(),
        },
        changedByUserId: userId,
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ASSET_RETURN,
      resource: 'assets',
      resourceId: id,
      details: {
        previousEmployeeId,
        returnCondition: data.returnCondition,
        returnDate,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async delete(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const asset = await this.findById(id, organizationId);
    if (asset.returnStatus === AssetReturnStatus.ASSIGNED) {
      throw new BadRequestException('Cannot delete an asset that is currently assigned. Return it first.');
    }

    await this.repository.delete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ASSET_DELETE,
      resource: 'assets',
      resourceId: id,
      details: { assetName: asset.assetName, assetSerialNumber: asset.assetSerialNumber },
      ipAddress: ip,
      userAgent: ua,
    });

    return { success: true };
  }
}
