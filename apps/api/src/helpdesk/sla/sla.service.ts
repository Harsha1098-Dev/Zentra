import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SlaRepository } from './sla.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, EscalationStatus } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlaService {
  constructor(
    private readonly repository: SlaRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAllPolicies(organizationId: string) {
    return this.repository.findAllPolicies(organizationId);
  }

  async findPolicyById(organizationId: string, id: string) {
    const policy = await this.repository.findPolicyById(organizationId, id);
    if (!policy) {
      throw new NotFoundException(`SLA Policy with ID ${id} not found`);
    }
    return policy;
  }

  async createPolicy(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const policy = await this.repository.createPolicy(organizationId, {
      ...data,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.SLA_POLICY_CREATE,
      resource: 'SlaPolicy',
      resourceId: policy.id,
      ipAddress,
      userAgent,
      details: { name: policy.name },
    });

    return policy;
  }

  async updatePolicy(
    organizationId: string,
    id: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findPolicyById(organizationId, id);
    const updated = await this.repository.updatePolicy(organizationId, id, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.SLA_POLICY_UPDATE,
      resource: 'SlaPolicy',
      resourceId: id,
      ipAddress,
      userAgent,
      details: data,
    });

    return updated;
  }

  async deletePolicy(
    organizationId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findPolicyById(organizationId, id);
    return this.repository.deletePolicy(organizationId, id);
  }

  // Escalation Rules
  async createEscalationRule(
    organizationId: string,
    policyId: string,
    data: any,
    userId: string,
  ) {
    await this.findPolicyById(organizationId, policyId);
    return this.repository.createEscalationRule(organizationId, {
      ...data,
      slaPolicyId: policyId,
      createdBy: userId,
    });
  }

  async updateEscalationRule(
    organizationId: string,
    ruleId: string,
    data: any,
  ) {
    const existing = await this.repository.findEscalationRuleById(organizationId, ruleId);
    if (!existing) {
      throw new NotFoundException(`Escalation rule ${ruleId} not found`);
    }
    return this.repository.updateEscalationRule(organizationId, ruleId, data);
  }

  async deleteEscalationRule(organizationId: string, ruleId: string) {
    const existing = await this.repository.findEscalationRuleById(organizationId, ruleId);
    if (!existing) {
      throw new NotFoundException(`Escalation rule ${ruleId} not found`);
    }
    return this.repository.deleteEscalationRule(organizationId, ruleId);
  }

  /**
   * Calculates due dates for response and resolution according to policy
   */
  calculateDueDates(
    startDate: Date,
    policy: {
      responseTimeMinutes: number;
      resolutionTimeMinutes: number;
      businessHoursOnly: boolean;
      businessHoursStart?: string | null;
      businessHoursEnd?: string | null;
      workingDays?: any;
    },
  ): { responseDueAt: Date; resolutionDueAt: Date } {
    const responseDueAt = this.addBusinessMinutes(startDate, policy.responseTimeMinutes, policy);
    const resolutionDueAt = this.addBusinessMinutes(startDate, policy.resolutionTimeMinutes, policy);
    return { responseDueAt, resolutionDueAt };
  }

  private addBusinessMinutes(
    start: Date,
    minutesToAdd: number,
    policy: {
      businessHoursOnly: boolean;
      businessHoursStart?: string | null;
      businessHoursEnd?: string | null;
      workingDays?: any;
    },
  ): Date {
    if (!policy.businessHoursOnly) {
      return new Date(start.getTime() + minutesToAdd * 60 * 1000);
    }

    const startHourStr = policy.businessHoursStart || '09:00';
    const endHourStr = policy.businessHoursEnd || '18:00';
    const [startH, startM] = startHourStr.split(':').map(Number);
    const [endH, endM] = endHourStr.split(':').map(Number);
    const dailyBusinessMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    const workingDays: string[] = Array.isArray(policy.workingDays)
      ? policy.workingDays
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    let current = new Date(start);
    let remainingMinutes = minutesToAdd;

    // Helper: advance to next working day start if current is not in working hours
    while (remainingMinutes > 0) {
      const dayName = dayNames[current.getDay()];
      const isWorkDay = workingDays.includes(dayName);

      if (!isWorkDay) {
        // Move to next day at business start
        current.setDate(current.getDate() + 1);
        current.setHours(startH, startM, 0, 0);
        continue;
      }

      const currentMinutesInDay = current.getHours() * 60 + current.getMinutes();
      const dayStartMinutes = startH * 60 + startM;
      const dayEndMinutes = endH * 60 + endM;

      if (currentMinutesInDay < dayStartMinutes) {
        current.setHours(startH, startM, 0, 0);
        continue;
      }

      if (currentMinutesInDay >= dayEndMinutes) {
        current.setDate(current.getDate() + 1);
        current.setHours(startH, startM, 0, 0);
        continue;
      }

      // We are inside working hours
      const availableMinutesToday = dayEndMinutes - currentMinutesInDay;
      if (remainingMinutes <= availableMinutesToday) {
        current.setTime(current.getTime() + remainingMinutes * 60 * 1000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= availableMinutesToday;
        current.setDate(current.getDate() + 1);
        current.setHours(startH, startM, 0, 0);
      }
    }

    return current;
  }

  /**
   * Run escalation evaluation on open tickets
   */
  async evaluateTicketEscalations(organizationId: string) {
    const now = new Date();
    const openTickets = await this.prisma.ticket.findMany({
      where: {
        organizationId,
        ticketStatus: {
          notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'],
        },
        slaPolicyId: { not: null },
      },
      include: {
        slaPolicy: {
          include: {
            escalationRules: {
              where: { isActive: true },
              orderBy: { escalationLevel: 'asc' },
            },
          },
        },
      },
    });

    const results = [];

    for (const ticket of openTickets) {
      if (!ticket.slaPolicy?.escalationRules || ticket.slaPolicy.escalationRules.length === 0) {
        continue;
      }

      for (const rule of ticket.slaPolicy.escalationRules) {
        let isBreached = false;
        let shouldEscalate = false;

        const targetDue = rule.escalationType === 'RESPONSE_BREACH'
          ? ticket.slaResponseDueAt
          : ticket.slaResolutionDueAt;

        if (!targetDue) continue;

        // Before breach trigger
        if (rule.triggerBeforeMinutes && rule.triggerBeforeMinutes > 0) {
          const warningTime = new Date(targetDue.getTime() - rule.triggerBeforeMinutes * 60 * 1000);
          if (now >= warningTime && now < targetDue) {
            shouldEscalate = true;
          }
        }

        // After breach trigger
        if (now >= targetDue) {
          isBreached = true;
          if (rule.triggerAfterMinutes !== null && rule.triggerAfterMinutes !== undefined) {
            const afterTime = new Date(targetDue.getTime() + (rule.triggerAfterMinutes || 0) * 60 * 1000);
            if (now >= afterTime) {
              shouldEscalate = true;
            }
          } else {
            shouldEscalate = true;
          }
        }

        if (shouldEscalate) {
          const updateData: any = {
            escalationLevel: rule.escalationLevel,
            escalationStatus: isBreached ? EscalationStatus.BREACHED : EscalationStatus.ESCALATED,
          };

          if (rule.changePriority && rule.newPriority) {
            updateData.priority = rule.newPriority;
          }

          if (rule.reassignTicket && rule.escalateToId) {
            updateData.assignedAgentId = rule.escalateToId;
          }

          await this.prisma.ticket.update({
            where: { id: ticket.id },
            data: updateData,
          });

          await this.auditService.log({
            organizationId,
            userId: 'SYSTEM',
            action: AuditAction.TICKET_ESCALATE,
            resource: 'Ticket',
            resourceId: ticket.id,
            details: {
              ruleId: rule.id,
              escalationLevel: rule.escalationLevel,
              isBreached,
              newPriority: rule.newPriority,
            },
          });

          results.push({ ticketId: ticket.id, ruleId: rule.id, isBreached });
        }
      }
    }

    return results;
  }
}
