import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  InviteUserSchema,
  InviteUserInput,
  AcceptInvitationSchema,
  AcceptInvitationInput,
} from '@zentra/shared-types';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get('current')
  async getCurrentOrganization(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const org = await this.orgsService.getOrganizationById(user.organizationId);
    return org;
  }

  @Post(':organizationId/invitations')
  @RequirePermissions('user.invite')
  async inviteUser(
    @Param('organizationId') organizationIdParam: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(InviteUserSchema)) body: InviteUserInput,
    @Req() req: Request,
  ) {
    // Strictly derive active organization from authenticated user session
    if (!user.organizationId || user.organizationId !== organizationIdParam) {
      throw new ForbiddenException(
        'Forbidden: Operation is strictly scoped to your active authenticated organization',
      );
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.orgsService.inviteUser(
      user.organizationId,
      user.id,
      body.email,
      body.roleId,
      body.firstName,
      body.lastName,
      ipAddress,
      userAgent,
    );
  }

  @Get(':organizationId/invitations')
  @RequirePermissions('user.read')
  async getInvitations(
    @Param('organizationId') organizationIdParam: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId || user.organizationId !== organizationIdParam) {
      throw new ForbiddenException(
        'Forbidden: Operation is strictly scoped to your active authenticated organization',
      );
    }
    return this.orgsService.getInvitations(user.organizationId);
  }
}

// Controller for public invitation endpoint: POST /api/v1/invitations/:token/accept
@Controller('invitations')
export class InvitationsPublicController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Public()
  @Post(':token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(AcceptInvitationSchema)) body: AcceptInvitationInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.orgsService.acceptInvitation(
      token,
      body.password,
      body.firstName,
      body.lastName,
      ipAddress,
      userAgent,
    );
  }
}
