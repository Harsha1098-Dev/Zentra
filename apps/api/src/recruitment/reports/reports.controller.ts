import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('recruitment/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('job-opening-summary')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_VIEW)
  async getJobOpeningSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getJobOpeningSummary(user.organizationId);
  }

  @Get('candidate-pipeline')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_VIEW)
  async getCandidatePipeline(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getCandidatePipeline(user.organizationId);
  }

  @Get('interview-status')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_VIEW)
  async getInterviewStatus(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getInterviewStatus(user.organizationId);
  }

  @Get('offer-status')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_VIEW)
  async getOfferStatus(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOfferStatus(user.organizationId);
  }

  @Get('time-to-hire')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_VIEW)
  async getTimeToHire(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getTimeToHire(user.organizationId);
  }

  @Get('source-report')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_VIEW)
  async getSourceReport(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getSourceReport(user.organizationId);
  }

  @Post('export')
  @RequirePermissions(PermissionCode.RECRUITMENT_REPORT_EXPORT)
  async exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.exportReport(
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
