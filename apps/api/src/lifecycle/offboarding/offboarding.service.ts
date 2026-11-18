import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OffboardingRepository } from './offboarding.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  OffboardingStatus,
  ClearanceStatus,
  AssetReturnStatus,
  LifecycleLetterType,
} from '@zentra/shared-types';

@Injectable()
export class OffboardingService {
  constructor(
    private readonly repository: OffboardingRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const offboarding = await this.repository.findById(id, organizationId);
    if (!offboarding) {
      throw new NotFoundException(`Offboarding request '${id}' not found`);
    }
    return offboarding;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    const offboarding = await this.repository.create(
      organizationId,
      {
        employeeId: employee.id,
        resignationRequestId: data.resignationRequestId || null,
        exitType: data.exitType || 'RESIGNATION',
        lastWorkingDate: data.lastWorkingDate,
        status: OffboardingStatus.PENDING_CLEARANCE,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFBOARDING_CREATE,
      resource: 'offboarding_requests',
      resourceId: offboarding.id,
      details: {
        employeeId: employee.id,
        exitType: offboarding.exitType,
        lastWorkingDate: offboarding.lastWorkingDate,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return offboarding;
  }

  async complete(
    id: string,
    organizationId: string,
    data: {
      reassignedReportingManagerId?: string | null;
      exitReason?: string | null;
      generateRelievingLetter?: boolean;
      generateExperienceLetter?: boolean;
    },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const offboarding = await this.findById(id, organizationId);
    if (offboarding.status === OffboardingStatus.COMPLETED) {
      throw new BadRequestException('Offboarding has already been completed');
    }

    const employeeId = offboarding.employeeId;

    // 1. Mandatory Clearances Check
    const pendingClearances = await this.prisma.exitClearance.findMany({
      where: {
        organizationId,
        employeeId,
        isMandatory: true,
        status: ClearanceStatus.PENDING,
      },
    });

    if (pendingClearances.length > 0) {
      const types = pendingClearances.map((c) => c.clearanceType).join(', ');
      throw new BadRequestException(
        `Cannot complete offboarding: ${pendingClearances.length} mandatory exit clearance task(s) are still pending: ${types}`,
      );
    }

    // 2. Company Assets Return Check
    const unreturnedAssets = await this.prisma.asset.findMany({
      where: {
        organizationId,
        assignedEmployeeId: employeeId,
        returnStatus: AssetReturnStatus.ASSIGNED,
      },
    });

    if (unreturnedAssets.length > 0) {
      const assetNames = unreturnedAssets.map((a) => `${a.assetName} (${a.assetSerialNumber})`).join(', ');
      throw new BadRequestException(
        `Cannot complete offboarding: Employee has unreturned company assets (${assetNames}). Please return or clear assets before offboarding.`,
      );
    }

    // 3. Direct Reportees Check & Reassignment
    const directReportees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        reportingManagerId: employeeId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (directReportees.length > 0) {
      if (!data.reassignedReportingManagerId) {
        throw new BadRequestException(
          `Cannot complete offboarding: Employee has ${directReportees.length} active direct reportees. A new reporting manager must be selected to reassign them.`,
        );
      }

      if (data.reassignedReportingManagerId === employeeId) {
        throw new BadRequestException('Target reporting manager cannot be the employee being offboarded');
      }

      const targetManager = await this.prisma.employee.findFirst({
        where: {
          id: data.reassignedReportingManagerId,
          organizationId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      if (!targetManager) {
        throw new BadRequestException('Target reporting manager not found or inactive');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Reassign reportees if any
      if (directReportees.length > 0 && data.reassignedReportingManagerId) {
        await tx.employee.updateMany({
          where: {
            organizationId,
            reportingManagerId: employeeId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          data: {
            reportingManagerId: data.reassignedReportingManagerId,
          },
        });
      }

      // Mark employee as EXITED
      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: 'EXITED',
          dateOfExit: offboarding.lastWorkingDate,
          exitReason: data.exitReason || offboarding.exitType,
        },
      });

      // Mark offboarding as COMPLETED
      const completedOffboarding = await tx.offboardingRequest.update({
        where: { id },
        data: {
          status: OffboardingStatus.COMPLETED,
          completedAt: new Date(),
          completedBy: userId,
        },
      });

      // Add history event
      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId,
          eventType: 'OFFBOARDING_COMPLETED',
          effectiveFrom: offboarding.lastWorkingDate,
          remarks: `Offboarding completed on ${new Date().toLocaleDateString()}. Status changed to EXITED. Exit reason: ${data.exitReason || offboarding.exitType}.`,
          newValues: {
            offboardingRequestId: id,
            lastWorkingDate: offboarding.lastWorkingDate.toISOString(),
            dateOfExit: offboarding.lastWorkingDate.toISOString(),
            reassignedReporteesCount: directReportees.length,
          },
          changedByUserId: userId,
        },
      });

      // Auto-generate Relieving Letter if requested
      if (data.generateRelievingLetter) {
        await tx.lifecycleLetter.create({
          data: {
            organizationId,
            employeeId,
            letterType: LifecycleLetterType.RELIEVING,
            title: `Relieving Letter - ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
            content: `This is to certify that ${updatedEmployee.firstName} ${updatedEmployee.lastName} has been relieved from their duties effective ${offboarding.lastWorkingDate.toLocaleDateString()}. All exit clearances have been satisfactorily completed.`,
            issuedDate: new Date(),
            generatedBy: userId,
            isSharedWithEmployee: true,
          },
        });
      }

      // Auto-generate Experience Letter if requested
      if (data.generateExperienceLetter) {
        const joiningDateStr = updatedEmployee.dateOfJoining ? updatedEmployee.dateOfJoining.toLocaleDateString() : 'N/A';
        await tx.lifecycleLetter.create({
          data: {
            organizationId,
            employeeId,
            letterType: LifecycleLetterType.EXPERIENCE,
            title: `Experience Certificate - ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
            content: `This is to certify that ${updatedEmployee.firstName} ${updatedEmployee.lastName} was employed with us from ${joiningDateStr} to ${offboarding.lastWorkingDate.toLocaleDateString()}. During their tenure, their conduct was found to be satisfactory. We wish them all the best in future endeavors.`,
            issuedDate: new Date(),
            generatedBy: userId,
            isSharedWithEmployee: true,
          },
        });
      }

      return completedOffboarding;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFBOARDING_COMPLETE,
      resource: 'offboarding_requests',
      resourceId: id,
      details: {
        employeeId,
        lastWorkingDate: offboarding.lastWorkingDate,
        dateOfExit: offboarding.lastWorkingDate,
        exitReason: data.exitReason,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return result;
  }

  async cancel(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const offboarding = await this.findById(id, organizationId);
    if (offboarding.status === OffboardingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel already completed offboarding');
    }

    const updated = await this.repository.update(id, organizationId, {
      status: OffboardingStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFBOARDING_CANCEL,
      resource: 'offboarding_requests',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async saveExitInterview(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const result = await this.repository.saveExitInterview(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.EXIT_INTERVIEW_SUBMIT,
      resource: 'exit_interviews',
      resourceId: result.id,
      details: { employeeId: data.employeeId, exitReason: data.exitReason },
      ipAddress: ip,
      userAgent: ua,
    });

    return result;
  }
}
