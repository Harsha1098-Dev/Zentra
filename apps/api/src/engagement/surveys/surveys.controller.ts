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
import { SurveysService } from './surveys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('engagement/surveys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SurveysController {
  constructor(
    private readonly service: SurveysService,
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
  @RequirePermissions(PermissionCode.SURVEY_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, status, type);
  }

  @Get('my-surveys')
  @RequirePermissions(PermissionCode.SURVEY_READ)
  async getMySurveys(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getMySurveys(user.organizationId, employeeId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.SURVEY_READ)
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
  @RequirePermissions(PermissionCode.SURVEY_CREATE)
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
  @RequirePermissions(PermissionCode.SURVEY_UPDATE)
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
  @RequirePermissions(PermissionCode.SURVEY_DELETE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(user.organizationId, id);
  }

  @Post(':id/publish')
  @RequirePermissions(PermissionCode.SURVEY_PUBLISH)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.publish(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/close')
  @RequirePermissions(PermissionCode.SURVEY_CLOSE)
  async close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.close(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/questions')
  @RequirePermissions(PermissionCode.SURVEY_UPDATE)
  async addQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.addQuestion(user.organizationId, id, body);
  }

  @Put(':id/questions/:questionId')
  @RequirePermissions(PermissionCode.SURVEY_UPDATE)
  async updateQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.updateQuestion(user.organizationId, id, questionId, body);
  }

  @Delete(':id/questions/:questionId')
  @RequirePermissions(PermissionCode.SURVEY_UPDATE)
  async deleteQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deleteQuestion(user.organizationId, id, questionId);
  }

  @Post(':id/submit')
  @RequirePermissions(PermissionCode.SURVEY_RESPOND)
  async submitResponse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { answers: any[] },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.submitResponse(
      user.organizationId,
      id,
      employeeId,
      body.answers || [],
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id/enps')
  @RequirePermissions(PermissionCode.SURVEY_RESULTS_VIEW)
  async calculateEnps(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.calculateEnps(user.organizationId, id);
  }
}
