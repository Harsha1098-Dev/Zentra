import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FaqsRepository } from './faqs.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class FaqsService {
  constructor(
    private readonly repository: FaqsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(organizationId: string, id: string) {
    const faq = await this.repository.findById(organizationId, id);
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async suggest(organizationId: string, categoryId?: string, query?: string) {
    return this.repository.suggest(organizationId, categoryId, query);
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const faq = await this.repository.create(organizationId, {
      ...data,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.FAQ_CREATE,
      resource: 'Faq',
      resourceId: faq.id,
      ipAddress,
      userAgent,
      details: { question: faq.question },
    });

    return faq;
  }

  async update(
    organizationId: string,
    id: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findById(organizationId, id);
    const updated = await this.repository.update(organizationId, id, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.FAQ_UPDATE,
      resource: 'Faq',
      resourceId: id,
      ipAddress,
      userAgent,
      details: data,
    });

    return updated;
  }

  async voteHelpfulness(organizationId: string, id: string, isHelpful: boolean) {
    await this.findById(organizationId, id);
    return this.repository.voteHelpfulness(id, isHelpful);
  }

  async delete(organizationId: string, id: string) {
    await this.findById(organizationId, id);
    return this.repository.delete(organizationId, id);
  }
}
