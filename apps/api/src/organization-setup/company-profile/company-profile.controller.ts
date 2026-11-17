import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CompanyProfileService } from './company-profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  UpdateCompanyProfileSchema,
  UpdateCompanyProfileInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('organizations/current/profile')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyProfileController {
  constructor(private readonly profileService: CompanyProfileService) {}

  @Get()
  @RequirePermissions(PermissionCode.ORGANIZATION_READ)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.profileService.getProfile(user.organizationId);
  }

  @Patch()
  @RequirePermissions(PermissionCode.ORGANIZATION_UPDATE)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateCompanyProfileSchema)) body: UpdateCompanyProfileInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.profileService.updateProfile(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post('logo')
  @RequirePermissions(PermissionCode.ORGANIZATION_LOGO_MANAGE)
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.profileService.uploadLogo(
      user.organizationId,
      file,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Delete('logo')
  @RequirePermissions(PermissionCode.ORGANIZATION_LOGO_MANAGE)
  async removeLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.profileService.removeLogo(
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
