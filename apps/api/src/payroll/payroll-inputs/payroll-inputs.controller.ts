import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PayrollInputsService } from './payroll-inputs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreatePayrollInputSchema,
  UpdatePayrollInputSchema,
} from '@zentra/shared-types';

@Controller('payroll/runs/:runId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollInputsController {
  constructor(private readonly service: PayrollInputsService) {}

  @Get('inputs')
  @RequirePermissions(PermissionCode.PAYROLL_INPUT_READ)
  async findByRun(@CurrentUser() user: AuthenticatedUser, @Param('runId') runId: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findByRun(runId, user.organizationId);
  }

  @Post('inputs')
  @RequirePermissions(PermissionCode.PAYROLL_INPUT_CREATE)
  async createInput(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreatePayrollInputSchema.parse(body);
    return this.service.createManualInput(runId, user.organizationId, validated, user.id, req.ip);
  }

  @Patch('inputs/:inputId')
  @RequirePermissions(PermissionCode.PAYROLL_INPUT_UPDATE)
  async updateInput(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Param('inputId') inputId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdatePayrollInputSchema.parse(body);
    return this.service.updateManualInput(
      inputId,
      runId,
      user.organizationId,
      validated,
      user.id,
      req.ip,
    );
  }

  @Delete('inputs/:inputId')
  @RequirePermissions(PermissionCode.PAYROLL_INPUT_DELETE)
  async deleteInput(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Param('inputId') inputId: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deleteManualInput(inputId, runId, user.organizationId, user.id, req.ip);
  }

  @Post('import-attendance-leave')
  @RequirePermissions(PermissionCode.PAYROLL_INPUT_CREATE)
  async importAttendanceAndLeave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.importAttendanceAndLeave(runId, user.organizationId, user.id, req.ip);
  }
}
