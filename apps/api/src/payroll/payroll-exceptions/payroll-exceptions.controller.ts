import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PayrollExceptionsService } from './payroll-exceptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  ResolveExceptionSchema,
  OverrideExceptionSchema,
} from '@zentra/shared-types';

@Controller('payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollExceptionsController {
  constructor(private readonly service: PayrollExceptionsService) {}

  @Get('runs/:runId/exceptions')
  @RequirePermissions(PermissionCode.PAYROLL_EXCEPTION_READ)
  async findByRun(@CurrentUser() user: AuthenticatedUser, @Param('runId') runId: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findByRun(runId, user.organizationId);
  }

  @Post('exceptions/:id/resolve')
  @RequirePermissions(PermissionCode.PAYROLL_EXCEPTION_RESOLVE)
  async resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ResolveExceptionSchema.parse(body);
    return this.service.resolve(
      id,
      user.organizationId,
      validated.resolutionNotes,
      user.id,
      req.ip,
    );
  }

  @Post('exceptions/:id/override')
  @RequirePermissions(PermissionCode.PAYROLL_EXCEPTION_RESOLVE)
  async override(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = OverrideExceptionSchema.parse(body);
    return this.service.override(
      id,
      user.organizationId,
      validated.overrideReason,
      user.id,
      req.ip,
    );
  }
}
