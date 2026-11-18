import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AppraisalsService } from './appraisals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateAppraisalAssignmentSchema,
  SubmitSelfReviewSchema,
  SubmitManagerReviewSchema,
  AcknowledgeAppraisalSchema,
} from '@zentra/shared-types';

@Controller('appraisal-assignments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppraisalAssignmentsController {
  constructor(private readonly service: AppraisalsService) {}

  @Get()
  @RequirePermissions(PermissionCode.APPRAISAL_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllAssignments(
      user.organizationId,
      query,
      user.id,
      user.roles || [],
    );
  }

  @Post()
  @RequirePermissions(PermissionCode.APPRAISAL_APPROVE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateAppraisalAssignmentSchema.parse(body);
    return this.service.createAssignment(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.APPRAISAL_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAssignmentById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.APPRAISAL_APPROVE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.updateAssignment(id, user.organizationId, body);
  }

  @Post(':id/self-review')
  @RequirePermissions(PermissionCode.APPRAISAL_SUBMIT)
  async submitSelfReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = SubmitSelfReviewSchema.parse(body);
    return this.service.submitSelfReview(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/manager-review')
  @RequirePermissions(PermissionCode.APPRAISAL_REVIEW)
  async submitManagerReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = SubmitManagerReviewSchema.parse(body);
    return this.service.submitManagerReview(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.APPRAISAL_APPROVE)
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.approveAssignment(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.APPRAISAL_REJECT)
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.rejectAssignment(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/publish')
  @RequirePermissions(PermissionCode.APPRAISAL_PUBLISH)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.publishAssignment(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/acknowledge')
  @RequirePermissions(PermissionCode.APPRAISAL_READ)
  async acknowledge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = AcknowledgeAppraisalSchema.parse(body);
    return this.service.acknowledgeAssignment(
      id,
      user.organizationId,
      validated.comments || '',
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
