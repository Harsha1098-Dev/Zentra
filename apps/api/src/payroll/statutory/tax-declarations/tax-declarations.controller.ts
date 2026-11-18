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
import { TaxDeclarationsService } from './tax-declarations.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  TaxDeclarationSchema,
  UpdateTaxDeclarationSchema,
  ReviewTaxDeclarationSchema,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaxDeclarationsController {
  constructor(private readonly service: TaxDeclarationsService) {}

  @Get('me/investment-declarations')
  async getMyDeclarations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyDeclarations(user.organizationId, user.id, user.email, financialYear);
  }

  @Post('me/investment-declarations')
  async createMyDeclaration(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = TaxDeclarationSchema.parse(body);
    return this.service.createMyDeclaration(
      user.organizationId,
      user.id,
      validated,
      user.email,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Put('me/investment-declarations/:id')
  async updateMyDeclaration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateTaxDeclarationSchema.parse(body);
    return this.service.updateMyDeclaration(
      id,
      user.organizationId,
      user.id,
      validated,
      user.email,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('me/investment-declarations/submit')
  async submitMyDeclarations(
    @CurrentUser() user: AuthenticatedUser,
    @Body('financialYear') financialYear: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.submitMyDeclarations(
      user.organizationId,
      user.id,
      financialYear || '2025-2026',
      user.email,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('payroll/tax-declarations')
  @RequirePermissions(PermissionCode.PAYROLL_TAX_DECLARATION_READ)
  async findAllDeclarations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('financialYear') financialYear?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllDeclarations(user.organizationId, {
      financialYear,
      status,
      employeeId,
    });
  }

  @Put('payroll/tax-declarations/:id/review')
  @RequirePermissions(PermissionCode.PAYROLL_TAX_DECLARATION_REVIEW)
  async reviewDeclaration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ReviewTaxDeclarationSchema.parse(body);
    return this.service.reviewDeclaration(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
