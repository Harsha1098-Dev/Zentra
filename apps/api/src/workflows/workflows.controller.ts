import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateWorkflowRuleSchema,
  CreateWorkflowRuleInput,
  UpdateWorkflowRuleSchema,
  UpdateWorkflowRuleInput,
  WorkflowQueryFilterSchema,
  WorkflowQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('workflows')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @RequirePermissions(PermissionCode.WORKFLOW_CREATE)
  async createRule(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateWorkflowRuleSchema)) input: CreateWorkflowRuleInput,
    @Req() req: Request,
  ) {
    return this.workflowsService.createRule(
      user.organizationId!,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get()
  @RequirePermissions(PermissionCode.WORKFLOW_READ)
  async listRules(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(WorkflowQueryFilterSchema)) filter: WorkflowQueryFilterInput,
  ) {
    return this.workflowsService.listRules(user.organizationId!, filter);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.WORKFLOW_READ)
  async getRuleById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.workflowsService.getRuleById(id, user.organizationId!);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.WORKFLOW_UPDATE)
  async updateRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateWorkflowRuleSchema)) input: UpdateWorkflowRuleInput,
    @Req() req: Request,
  ) {
    return this.workflowsService.updateRule(
      id,
      user.organizationId!,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PermissionCode.WORKFLOW_DELETE)
  async deleteRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await this.workflowsService.deleteRule(
      id,
      user.organizationId!,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/activate')
  @RequirePermissions(PermissionCode.WORKFLOW_UPDATE)
  async activateRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.workflowsService.activateRule(
      id,
      user.organizationId!,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/deactivate')
  @RequirePermissions(PermissionCode.WORKFLOW_UPDATE)
  async deactivateRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.workflowsService.deactivateRule(
      id,
      user.organizationId!,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/test')
  @RequirePermissions(PermissionCode.WORKFLOW_READ)
  async testRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { context: Record<string, any> },
  ) {
    return this.workflowsService.testRule(
      id,
      user.organizationId!,
      body?.context || {},
    );
  }

  @Get(':id/executions')
  @RequirePermissions(PermissionCode.WORKFLOW_READ)
  async listExecutions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.workflowsService.listExecutions(id, user.organizationId!);
  }
}
