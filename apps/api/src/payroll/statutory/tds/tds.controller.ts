import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TdsService } from './tds.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import { PermissionCode, RecalculateTdsSchema } from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TdsController {
  constructor(private readonly service: TdsService) {}

  @Get('me/tax-summary')
  async getMyTaxSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyTaxSummary(
      user.organizationId,
      user.id,
      user.email,
      financialYear || '2025-2026',
    );
  }

  @Get('employees/:id/tax-summary')
  @RequirePermissions(PermissionCode.PAYROLL_TDS_READ)
  async getEmployeeTaxSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getEmployeeTaxSummary(user.organizationId, id, financialYear || '2025-2026');
  }

  @Post('payroll/runs/:id/recalculate-tds')
  @RequirePermissions(PermissionCode.PAYROLL_TDS_CALCULATE)
  async recalculateTds(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') runId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = RecalculateTdsSchema.parse(body);
    return this.service.recalculateTdsForRun(
      runId,
      user.organizationId,
      user.id,
      validated.employeeId,
      validated.financialYear || '2025-2026',
      req.ip,
      req.headers['user-agent'],
    );
  }
}
