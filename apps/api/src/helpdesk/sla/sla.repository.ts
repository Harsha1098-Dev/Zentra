import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPolicies(organizationId: string) {
    return this.prisma.slaPolicy.findMany({
      where: { organizationId },
      include: {
        escalationRules: true,
        _count: {
          select: {
            categories: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPolicyById(organizationId: string, id: string) {
    return this.prisma.slaPolicy.findFirst({
      where: { id, organizationId },
      include: {
        escalationRules: {
          orderBy: { escalationLevel: 'asc' },
        },
        categories: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  async createPolicy(organizationId: string, data: any) {
    return this.prisma.slaPolicy.create({
      data: {
        organizationId,
        ...data,
      },
      include: {
        escalationRules: true,
      },
    });
  }

  async updatePolicy(organizationId: string, id: string, data: any) {
    return this.prisma.slaPolicy.update({
      where: { id },
      data,
      include: {
        escalationRules: true,
      },
    });
  }

  async deletePolicy(organizationId: string, id: string) {
    return this.prisma.slaPolicy.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Escalation Rules
  async createEscalationRule(organizationId: string, data: any) {
    return this.prisma.slaEscalationRule.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async updateEscalationRule(organizationId: string, id: string, data: any) {
    return this.prisma.slaEscalationRule.update({
      where: { id },
      data,
    });
  }

  async deleteEscalationRule(organizationId: string, id: string) {
    return this.prisma.slaEscalationRule.delete({
      where: { id },
    });
  }

  async findEscalationRuleById(organizationId: string, id: string) {
    return this.prisma.slaEscalationRule.findFirst({
      where: { id, organizationId },
    });
  }
}
