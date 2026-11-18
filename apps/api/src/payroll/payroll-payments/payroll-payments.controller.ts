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
import { PayrollPaymentsService } from './payroll-payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  MarkPaidSchema,
  PaymentProofSchema,
} from '@zentra/shared-types';

@Controller('payroll/runs/:runId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollPaymentsController {
  constructor(private readonly service: PayrollPaymentsService) {}

  @Post('mark-paid')
  @RequirePermissions(PermissionCode.PAYROLL_PAYMENT_MARK_PAID)
  async markRunPaid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = MarkPaidSchema.parse(body);
    return this.service.markRunPaid(runId, user.organizationId, validated, user.id, req.ip);
  }

  @Post('employees/:employeeId/mark-paid')
  @RequirePermissions(PermissionCode.PAYROLL_PAYMENT_MARK_PAID)
  async markEmployeePaid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = MarkPaidSchema.parse(body);
    return this.service.markEmployeePaid(
      runId,
      employeeId,
      user.organizationId,
      validated,
      user.id,
      req.ip,
    );
  }

  @Post('payment-proof')
  @RequirePermissions(PermissionCode.PAYROLL_PAYMENT_UPLOAD_PROOF)
  async uploadPaymentProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = PaymentProofSchema.parse(body);
    return this.service.uploadPaymentProof(
      runId,
      user.organizationId,
      validated,
      user.id,
      req.ip,
    );
  }

  @Get('payment-status')
  @RequirePermissions(PermissionCode.PAYROLL_PAYMENT_READ)
  async getPaymentStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('runId') runId: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getPaymentStatus(runId, user.organizationId);
  }
}
