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
import { EmployeesImportService } from './employees-import.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesImportController {
  constructor(private readonly importService: EmployeesImportService) {}

  @Get('import-template')
  @RequirePermissions(PermissionCode.EMPLOYEE_IMPORT)
  getImportTemplate(@Res() res: Response) {
    const template = this.importService.getImportTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${template.fileName}"`,
    );
    return res.send(template.content);
  }

  @Post('import')
  @RequirePermissions(PermissionCode.EMPLOYEE_IMPORT)
  async importEmployees(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { csvContent: string; fileName?: string; dryRun?: boolean },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }

    if (body.dryRun) {
      // Return validation preview without committing to DB
      const result = await this.importService.parseAndValidateCsv(
        body.csvContent,
        user.organizationId,
      );
      return {
        preview: result.preview,
        errors: result.errors,
      };
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.importService.executeImport(
      body.csvContent,
      body.fileName || 'employees_import.csv',
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('import/:importId')
  @RequirePermissions(PermissionCode.EMPLOYEE_IMPORT)
  async getImportJob(
    @Param('importId') importId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.importService.getImportJob(importId, user.organizationId);
  }

  @Get('import/:importId/errors')
  @RequirePermissions(PermissionCode.EMPLOYEE_IMPORT)
  async downloadErrorReport(
    @Param('importId') importId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const csvContent = await this.importService.generateErrorReportCsv(
      importId,
      user.organizationId,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="import_${importId}_errors.csv"`,
    );
    return res.send(csvContent);
  }
}
