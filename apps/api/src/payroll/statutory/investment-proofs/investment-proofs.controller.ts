import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { InvestmentProofsService } from './investment-proofs.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  InvestmentProofSchema,
  VerifyInvestmentProofSchema,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvestmentProofsController {
  constructor(private readonly service: InvestmentProofsService) {}

  @Get('me/investment-proofs')
  async getMyProofs(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyProofs(user.organizationId, user.id, user.email);
  }

  @Post('me/investment-proofs')
  async createMyProof(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = InvestmentProofSchema.parse(body);
    return this.service.createMyProof(
      user.organizationId,
      user.id,
      validated,
      user.email,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('payroll/investment-proofs')
  @RequirePermissions(PermissionCode.PAYROLL_INVESTMENT_PROOF_READ)
  async findAllProofs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllProofs(user.organizationId, {
      verificationStatus,
      employeeId,
    });
  }

  @Put('payroll/investment-proofs/:id/verify')
  @RequirePermissions(PermissionCode.PAYROLL_INVESTMENT_PROOF_VERIFY)
  async verifyProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = VerifyInvestmentProofSchema.parse(body);
    return this.service.verifyProof(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
