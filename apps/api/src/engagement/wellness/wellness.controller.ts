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
import { WellnessService } from './wellness.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('engagement/wellness')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WellnessController {
  constructor(
    private readonly service: WellnessService,
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
  @RequirePermissions(PermissionCode.WELLNESS_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, status, category);
  }

  @Get('my-participations')
  @RequirePermissions(PermissionCode.WELLNESS_READ)
  async getMyParticipations(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.findEmployeeParticipations(user.organizationId, employeeId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.WELLNESS_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    let employeeId: string | undefined;
    try {
      employeeId = await this.getEmployeeId(user.organizationId, user.id);
    } catch {
      // Ignored if user has no employee
    }
    return this.service.findById(user.organizationId, id, employeeId);
  }

  @Post()
  @RequirePermissions(PermissionCode.WELLNESS_MANAGE)
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
  @RequirePermissions(PermissionCode.WELLNESS_MANAGE)
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
  @RequirePermissions(PermissionCode.WELLNESS_MANAGE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(user.organizationId, id);
  }

  @Post(':id/join')
  @RequirePermissions(PermissionCode.WELLNESS_JOIN)
  async join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.joinActivity(
      user.organizationId,
      id,
      employeeId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/complete')
  @RequirePermissions(PermissionCode.WELLNESS_COMPLETE)
  async complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.completeActivity(
      user.organizationId,
      id,
      employeeId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
