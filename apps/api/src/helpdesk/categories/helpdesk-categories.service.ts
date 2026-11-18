import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { HelpdeskCategoriesRepository } from './helpdesk-categories.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class HelpdeskCategoriesService {
  constructor(
    private readonly repository: HelpdeskCategoriesRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async findById(organizationId: string, id: string) {
    const category = await this.repository.findById(organizationId, id);
    if (!category) {
      throw new NotFoundException(`Helpdesk category with ID ${id} not found`);
    }
    return category;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check code uniqueness
    const existingCode = await this.repository.findByCode(organizationId, data.categoryCode);
    if (existingCode) {
      throw new ConflictException(`Category code '${data.categoryCode}' already exists`);
    }

    // Check name uniqueness
    const existingName = await this.repository.findByName(organizationId, data.name);
    if (existingName) {
      throw new ConflictException(`Category with name '${data.name}' already exists`);
    }

    // If parent category is provided, verify it exists
    if (data.parentCategoryId) {
      const parent = await this.repository.findById(organizationId, data.parentCategoryId);
      if (!parent) {
        throw new NotFoundException(`Parent category ${data.parentCategoryId} not found`);
      }
    }

    const category = await this.repository.create(organizationId, {
      ...data,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.HELPDESK_CATEGORY_CREATE,
      resource: 'HelpdeskCategory',
      resourceId: category.id,
      ipAddress,
      userAgent,
      details: { name: category.name, categoryCode: category.categoryCode },
    });

    return category;
  }

  async update(
    organizationId: string,
    id: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.findById(organizationId, id);

    if (data.categoryCode && data.categoryCode !== existing.categoryCode) {
      const duplicateCode = await this.repository.findByCode(organizationId, data.categoryCode);
      if (duplicateCode && duplicateCode.id !== id) {
        throw new ConflictException(`Category code '${data.categoryCode}' is already in use`);
      }
    }

    if (data.name && data.name !== existing.name) {
      const duplicateName = await this.repository.findByName(organizationId, data.name);
      if (duplicateName && duplicateName.id !== id) {
        throw new ConflictException(`Category name '${data.name}' is already in use`);
      }
    }

    if (data.parentCategoryId && data.parentCategoryId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    // Soft-deactivation check: if setting isActive to false, check for active open tickets
    if (data.isActive === false && existing.isActive === true) {
      const openTicketsCount = await this.repository.countOpenTickets(organizationId, id);
      if (openTicketsCount > 0) {
        throw new BadRequestException(
          `Cannot deactivate category '${existing.name}' because it has ${openTicketsCount} open or pending ticket(s). Reassign or close them before deactivating.`,
        );
      }
    }

    const updated = await this.repository.update(organizationId, id, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: data.isActive === false ? AuditAction.HELPDESK_CATEGORY_DEACTIVATE : AuditAction.HELPDESK_CATEGORY_UPDATE,
      resource: 'HelpdeskCategory',
      resourceId: id,
      ipAddress,
      userAgent,
      details: data,
    });

    return updated;
  }

  async deactivate(
    organizationId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.update(organizationId, id, { isActive: false }, userId, ipAddress, userAgent);
  }

  // SubCategories
  async createSubCategory(
    organizationId: string,
    categoryId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findById(organizationId, categoryId);

    const subCategory = await this.repository.createSubCategory(organizationId, {
      ...data,
      helpdeskCategoryId: categoryId,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.HELPDESK_CATEGORY_CREATE,
      resource: 'HelpdeskSubCategory',
      resourceId: subCategory.id,
      ipAddress,
      userAgent,
      details: { name: subCategory.name, helpdeskCategoryId: categoryId },
    });

    return subCategory;
  }

  async updateSubCategory(
    organizationId: string,
    categoryId: string,
    subCategoryId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.repository.findSubCategoryById(organizationId, subCategoryId);
    if (!existing || existing.helpdeskCategoryId !== categoryId) {
      throw new NotFoundException(`Sub-category with ID ${subCategoryId} not found under category ${categoryId}`);
    }

    if (data.isActive === false && existing.isActive === true) {
      const openCount = await this.repository.countOpenTicketsForSubCategory(organizationId, subCategoryId);
      if (openCount > 0) {
        throw new BadRequestException(
          `Cannot deactivate sub-category '${existing.name}' because it has ${openCount} open ticket(s).`,
        );
      }
    }

    const updated = await this.repository.updateSubCategory(organizationId, subCategoryId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.HELPDESK_CATEGORY_UPDATE,
      resource: 'HelpdeskSubCategory',
      resourceId: subCategoryId,
      ipAddress,
      userAgent,
      details: data,
    });

    return updated;
  }
}
