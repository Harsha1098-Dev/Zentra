import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EmployeesExportService } from './employees-export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { EmployeeQueryFilterInput, PermissionCode } from '@zentra/shared-types';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesExportController {
  constructor(private readonly exportService: EmployeesExportService) {}

  @Post('export')
  @RequirePermissions(PermissionCode.EMPLOYEE_EXPORT)
  async exportEmployees(
    @CurrentUser() user: AuthenticatedUser,
    @Body() filter: EmployeeQueryFilterInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.exportService.generateExport(
      user.organizationId,
      filter || {},
      user.roles || [],
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('export/:exportId')
  @RequirePermissions(PermissionCode.EMPLOYEE_EXPORT)
  async downloadExport(
    @Param('exportId') exportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const { fileName, fileContent } = await this.exportService.getExportFile(
      exportId,
      user.organizationId,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    return res.send(fileContent);
  }
}
