import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
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
  CreateTicketConversationSchema,
  CreateTicketFeedbackSchema,
  TicketConversationAuthorType,
} from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('me/tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MyTicketsController {
  constructor(
    private readonly service: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getEmployeeForUser(organizationId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId },
    });
    if (!employee) {
      throw new BadRequestException('Logged-in user is not linked to an employee profile');
    }
    return employee;
  }

  @Get()
  @RequirePermissions(PermissionCode.TICKET_READ_OWN)
  async findMyTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employee = await this.getEmployeeForUser(user.organizationId, user.id);
    return this.service.findAll(user.organizationId, {
      ...query,
      employeeId: employee.id,
    });
  }

  @Post()
  @RequirePermissions(PermissionCode.TICKET_CREATE_OWN)
  async createMyTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employee = await this.getEmployeeForUser(user.organizationId, user.id);
    const validated = CreateTicketSchema.parse(body);

    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
      employee.id,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.TICKET_READ_OWN)
  async findMyTicketById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employee = await this.getEmployeeForUser(user.organizationId, user.id);
    const ticket = await this.service.findById(user.organizationId, id, user.id, false);

    // Verify employee owns the ticket
    if (ticket.employeeId !== employee.id) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    return ticket;
  }

  @Post(':id/reply')
  @RequirePermissions(PermissionCode.TICKET_READ_OWN)
  async replyToMyTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employee = await this.getEmployeeForUser(user.organizationId, user.id);
    const ticket = await this.service.findById(user.organizationId, id, user.id, false);

    if (ticket.employeeId !== employee.id) {
      throw new ForbiddenException('You do not have permission to reply to this ticket');
    }

    const validated = CreateTicketConversationSchema.parse({
      ...body,
      isInternal: false, // Employees can never create internal notes!
    });

    return this.service.addConversation(
      user.organizationId,
      id,
      validated,
      user.id,
      TicketConversationAuthorType.EMPLOYEE,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/feedback')
  @RequirePermissions(PermissionCode.TICKET_FEEDBACK_SUBMIT)
  async submitFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateTicketFeedbackSchema.parse(body);
    return this.service.submitFeedback(
      user.organizationId,
      id,
      validated.rating,
      validated.comment || null,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
