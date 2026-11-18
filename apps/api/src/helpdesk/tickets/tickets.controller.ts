import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateTicketSchema,
  UpdateTicketSchema,
  CreateTicketConversationSchema,
  TicketConversationAuthorType,
} from '@zentra/shared-types';

@Controller('helpdesk/tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get()
  @RequirePermissions(PermissionCode.TICKET_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.TICKET_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id, user.id, true);
  }

  @Post()
  @RequirePermissions(PermissionCode.TICKET_CREATE_ALL)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateTicketSchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.TICKET_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateTicketSchema.parse(body);
    return this.service.update(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/assign')
  @RequirePermissions(PermissionCode.TICKET_ASSIGN)
  async assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { agentId: string | null; comments?: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.assign(
      user.organizationId,
      id,
      body.agentId,
      user.id,
      body.comments,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/status')
  @RequirePermissions(PermissionCode.TICKET_UPDATE)
  async changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { status: any; comments?: string },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.changeStatus(
      user.organizationId,
      id,
      body.status,
      user.id,
      body.comments,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/conversations')
  @RequirePermissions(PermissionCode.TICKET_UPDATE)
  async addConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateTicketConversationSchema.parse(body);
    return this.service.addConversation(
      user.organizationId,
      id,
      validated,
      user.id,
      TicketConversationAuthorType.AGENT,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/attachments')
  @RequirePermissions(PermissionCode.TICKET_UPDATE)
  async addAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { fileName: string; fileUrl: string; fileType: string; fileSize: number },
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.addAttachment(user.organizationId, id, body, user.id);
  }
}
