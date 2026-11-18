import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  ScheduleInterviewSchema,
  RescheduleInterviewSchema,
  SubmitInterviewFeedbackSchema,
} from '@zentra/shared-types';

@Controller('recruitment/interviews')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}

  @Get()
  @RequirePermissions(PermissionCode.INTERVIEW_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, query);
  }

  @Post()
  @RequirePermissions(PermissionCode.INTERVIEW_SCHEDULE)
  async schedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ScheduleInterviewSchema.parse(body);
    return this.service.schedule(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.INTERVIEW_READ)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Post(':id/reschedule')
  @RequirePermissions(PermissionCode.INTERVIEW_RESCHEDULE)
  async reschedule(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = RescheduleInterviewSchema.parse(body);
    return this.service.reschedule(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionCode.INTERVIEW_CANCEL)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { reason?: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.cancel(
      id,
      user.organizationId,
      body?.reason,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/feedback')
  @RequirePermissions(PermissionCode.INTERVIEW_FEEDBACK_SUBMIT)
  async submitFeedback(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = SubmitInterviewFeedbackSchema.parse(body);
    return this.service.submitFeedback(
      id,
      user.organizationId,
      validated,
      user.id,
      user.roles || [],
      req.ip,
      req.headers['user-agent'],
    );
  }
}
