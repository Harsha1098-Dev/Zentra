import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  RegisterCompanySchema,
  RegisterCompanyInput,
  LoginSchema,
  LoginInput,
  RefreshTokenSchema,
  RefreshTokenInput,
  ForgotPasswordSchema,
  ForgotPasswordInput,
  ResetPasswordSchema,
  ResetPasswordInput,
  VerifyEmailSchema,
  VerifyEmailInput,
  ResendVerificationSchema,
  ResendVerificationInput,
  SelectOrganizationSchema,
  SelectOrganizationInput,
} from '@zentra/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-company')
  async registerCompany(
    @Body(new ZodValidationPipe(RegisterCompanySchema)) body: RegisterCompanyInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.registerCompany(body, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(body, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshTokens(body.refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken?: string }) {
    return this.authService.logout(body.refreshToken || '');
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) body: ForgotPasswordInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.forgotPassword(body.email, ipAddress, userAgent);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.resetPassword(body.token, body.password, ipAddress, userAgent);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body(new ZodValidationPipe(VerifyEmailSchema)) body: VerifyEmailInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.verifyEmail(body.token, ipAddress, userAgent);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body(new ZodValidationPipe(ResendVerificationSchema)) body: ResendVerificationInput,
  ) {
    return this.authService.resendVerification(body.email);
  }
}

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipsService: MembershipsService,
  ) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id, user.organizationId);
  }

  @Get('organizations')
  async getOrganizations(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.getUserOrganizations(user.id);
  }

  @Post('select-organization')
  @HttpCode(HttpStatus.OK)
  async selectOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(SelectOrganizationSchema)) body: SelectOrganizationInput,
  ) {
    return this.authService.selectOrganization(user.id, body.organizationId);
  }
}
