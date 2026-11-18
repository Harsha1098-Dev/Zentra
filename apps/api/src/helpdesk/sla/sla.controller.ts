import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateSlaPolicySchema,
  UpdateSlaPolicySchema,
  CreateSlaEscalationRuleSchema,
} from '@zentra/shared-types';

@Controller('helpdesk/sla')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SlaController {
  constructor(private readonly service: SlaService) {}

  @Get('policies')
  @RequirePermissions(PermissionCode.SLA_POLICY_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllPolicies(user.organizationId);
  }

  @Get('policies/:id')
  @RequirePermissions(PermissionCode.SLA_POLICY_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findPolicyById(user.organizationId, id);
  }

  @Post('policies')
  @RequirePermissions(PermissionCode.SLA_POLICY_MANAGE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateSlaPolicySchema.parse(body);
    return this.service.createPolicy(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch('policies/:id')
  @RequirePermissions(PermissionCode.SLA_POLICY_MANAGE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateSlaPolicySchema.parse(body);
    return this.service.updatePolicy(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete('policies/:id')
  @RequirePermissions(PermissionCode.SLA_POLICY_MANAGE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deletePolicy(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('policies/:id/rules')
  @RequirePermissions(PermissionCode.SLA_ESCALATION_MANAGE)
  async createRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') policyId: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateSlaEscalationRuleSchema.parse({
      ...body,
      slaPolicyId: policyId,
    });
    return this.service.createEscalationRule(user.organizationId, policyId, validated, user.id);
  }

  @Patch('rules/:ruleId')
  @RequirePermissions(PermissionCode.SLA_ESCALATION_MANAGE)
  async updateRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ruleId') ruleId: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.updateEscalationRule(user.organizationId, ruleId, body);
  }

  @Delete('rules/:ruleId')
  @RequirePermissions(PermissionCode.SLA_ESCALATION_MANAGE)
  async deleteRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ruleId') ruleId: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deleteEscalationRule(user.organizationId, ruleId);
  }

  @Post('evaluate-escalations')
  @RequirePermissions(PermissionCode.SLA_ESCALATION_MANAGE)
  async evaluateEscalations(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.evaluateTicketEscalations(user.organizationId);
  }
}
