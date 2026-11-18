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
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('engagement/badges')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BadgesController {
  constructor(
    private readonly service: BadgesService,
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
  @RequirePermissions(PermissionCode.BADGE_READ)
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

  @Get('my-badges')
  @RequirePermissions(PermissionCode.BADGE_READ)
  async getMyBadges(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.findEmployeeBadges(user.organizationId, employeeId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.BADGE_READ)
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
  @RequirePermissions(PermissionCode.BADGE_MANAGE)
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
  @RequirePermissions(PermissionCode.BADGE_MANAGE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.update(user.organizationId, id, body);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.BADGE_MANAGE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(user.organizationId, id);
  }

  @Post('award')
  @RequirePermissions(PermissionCode.BADGE_AWARD)
  async awardBadge(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { badgeId: string; employeeId: string; reason?: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.awardBadge(
      user.organizationId,
      body.badgeId,
      body.employeeId,
      body.reason,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
