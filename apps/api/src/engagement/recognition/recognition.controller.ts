import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { RecognitionService } from './recognition.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('engagement/recognition')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RecognitionController {
  constructor(
    private readonly service: RecognitionService,
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
  @RequirePermissions(PermissionCode.RECOGNITION_READ)
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

  @Get('programs')
  @RequirePermissions(PermissionCode.RECOGNITION_READ)
  async findAllPrograms(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllPrograms(user.organizationId);
  }

  @Post('programs')
  @RequirePermissions(PermissionCode.RECOGNITION_MANAGE)
  async createProgram(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.createProgram(user.organizationId, body);
  }

  @Get('points/balance')
  @RequirePermissions(PermissionCode.RECOGNITION_READ)
  async getPointsBalance(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    const balance = await this.service.getEmployeePointsBalance(user.organizationId, employeeId);
    return { pointsBalance: balance };
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.RECOGNITION_READ)
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
  @RequirePermissions(PermissionCode.RECOGNITION_GIVE)
  async giveRecognition(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const senderEmployeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.giveRecognition(
      user.organizationId,
      senderEmployeeId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.RECOGNITION_APPROVE)
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.approve(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.RECOGNITION_APPROVE)
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.reject(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/like')
  @RequirePermissions(PermissionCode.RECOGNITION_READ)
  async like(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.like(user.organizationId, id);
  }
}
