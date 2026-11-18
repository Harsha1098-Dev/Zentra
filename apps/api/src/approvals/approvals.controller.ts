import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  ApprovalQueryFilterSchema,
  ApprovalQueryFilterInput,
  ApprovalDecisionSchema,
  ApprovalDecisionInput,
  ApprovalStatus,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @RequirePermissions(PermissionCode.APPROVAL_READ)
  async getApprovals(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ApprovalQueryFilterSchema)) query: ApprovalQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.approvalsService.getApprovals(user.organizationId, query, user.id);
  }

  @Get('pending')
  @RequirePermissions(PermissionCode.APPROVAL_READ)
  async getPendingApprovals(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ApprovalQueryFilterSchema)) query: ApprovalQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.approvalsService.getApprovals(
      user.organizationId,
      { ...query, scope: 'awaiting_me', status: ApprovalStatus.PENDING },
      user.id,
    );
  }

  @Get('history')
  @RequirePermissions(PermissionCode.APPROVAL_READ)
  async getApprovalHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ApprovalQueryFilterSchema)) query: ApprovalQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.approvalsService.getApprovals(
      user.organizationId,
      { ...query, scope: 'my_requests' },
      user.id,
    );
  }

  @Post()
  @RequirePermissions(PermissionCode.APPROVAL_CREATE)
  async createApprovalFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.approvalsService.createApprovalFlow({
      organizationId: user.organizationId,
      requestType: body.requestType,
      entityType: body.entityType,
      entityId: body.entityId,
      requestedBy: user.id,
      steps: body.steps,
      metadata: body.metadata,
      actorUserId: user.id,
    });
  }

  @Post('escalations/check')
  @RequirePermissions(PermissionCode.APPROVAL_READ)
  async checkEscalations(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const escalated = await this.approvalsService.checkOverdueEscalations(user.organizationId);
    return { escalatedCount: escalated };
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.APPROVAL_READ)
  async getApprovalById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.approvalsService.getApprovalById(id, user.organizationId);
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.APPROVAL_APPROVE)
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'approve', comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.APPROVAL_REJECT)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'reject', comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/request-changes')
  @RequirePermissions(PermissionCode.APPROVAL_APPROVE)
  async requestChanges(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'request_changes', comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionCode.APPROVAL_CANCEL)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'cancel', comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/delegate')
  @RequirePermissions(PermissionCode.APPROVAL_DELEGATE)
  async delegate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('delegateToUserId') delegateToUserId: string,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'delegate', delegateToUserId, comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/reassign')
  @RequirePermissions(PermissionCode.APPROVAL_REASSIGN)
  async reassign(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('reassignToUserId') reassignToUserId: string,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'reassign', reassignToUserId, comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/escalate')
  @RequirePermissions(PermissionCode.APPROVAL_ESCALATE)
  async escalate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('comments') comments: string | undefined,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.approvalsService.processDecision(
      id,
      user.organizationId,
      { decision: 'escalate', comments },
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
