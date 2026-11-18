import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('engagement/rewards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RewardsController {
  constructor(
    private readonly service: RewardsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getEmployeeId(organizationId: string, userId: string): Promise<string> {
    const employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId },
      select: { id: true },
    });
    if (!employee) {
      throw new BadRequestException('Current user is not mapped to an active employee record');
    }
    return employee.id;
  }

  @Get()
  @RequirePermissions(PermissionCode.REWARD_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('isActive') isActive?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const isActiveOnly = isActive !== 'false';
    return this.service.findAll(user.organizationId, isActiveOnly);
  }

  @Get('redemptions')
  @RequirePermissions(PermissionCode.REWARD_READ)
  async findRedemptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('all') all?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    let employeeId: string | undefined;
    if (all !== 'true') {
      try {
        employeeId = await this.getEmployeeId(user.organizationId, user.id);
      } catch {
        // Fallback to all if not an employee
      }
    }
    return this.service.findRedemptions(user.organizationId, employeeId, status);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.REWARD_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.REWARD_MANAGE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.create(
      user.organizationId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Put(':id')
  @RequirePermissions(PermissionCode.REWARD_MANAGE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.update(
      user.organizationId,
      id,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.REWARD_MANAGE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(user.organizationId, id);
  }

  @Post(':id/redeem')
  @RequirePermissions(PermissionCode.REWARD_REDEEM)
  async redeem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.redeem(
      user.organizationId,
      id,
      employeeId,
      body.notes,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('redemptions/:id/status')
  @RequirePermissions(PermissionCode.REWARD_APPROVE)
  async updateRedemptionStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.updateRedemptionStatus(
      user.organizationId,
      id,
      body.status,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
