import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateCandidateSchema,
  UpdateCandidateSchema,
  CreateCandidateNoteSchema,
  ConvertToEmployeeSchema,
} from '@zentra/shared-types';

@Controller('recruitment/candidates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Get()
  @RequirePermissions(PermissionCode.CANDIDATE_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, query);
  }

  @Post()
  @RequirePermissions(PermissionCode.CANDIDATE_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateCandidateSchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.CANDIDATE_READ)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.CANDIDATE_UPDATE)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateCandidateSchema.parse(body);
    return this.service.update(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.CANDIDATE_DELETE)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/resume')
  @RequirePermissions(PermissionCode.CANDIDATE_RESUME_UPLOAD)
  async uploadResume(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { resumeUrl: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.uploadResume(
      id,
      user.organizationId,
      body.resumeUrl,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/documents')
  @RequirePermissions(PermissionCode.CANDIDATE_DOCUMENT_UPLOAD)
  async addDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.addDocument(
      id,
      user.organizationId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/notes')
  @RequirePermissions(PermissionCode.CANDIDATE_NOTE_CREATE)
  async addNote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateCandidateNoteSchema.parse(body);
    return this.service.addNote(id, user.organizationId, validated, user.id);
  }

  @Post(':id/convert-to-employee')
  @RequirePermissions(PermissionCode.CANDIDATE_CONVERT)
  async convertToEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ConvertToEmployeeSchema.parse(body);
    return this.service.convertToEmployee(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/onboard')
  @RequirePermissions(PermissionCode.CANDIDATE_ONBOARD)
  async triggerOnboarding(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.triggerOnboarding(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
