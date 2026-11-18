import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PipelinesRepository } from './pipelines.repository';
import { StageType } from '@zentra/shared-types';

@Injectable()
export class PipelinesService {
  constructor(private readonly repository: PipelinesRepository) {}

  async findAll(organizationId: string) {
    const pipelines = await this.repository.findAll(organizationId);
    if (pipelines.length === 0) {
      // Create a default pipeline with standard stages if none exists
      const defaultPipeline = await this.createDefaultPipeline(organizationId);
      return [defaultPipeline];
    }
    return pipelines;
  }

  async findById(id: string, organizationId: string) {
    const pipeline = await this.repository.findById(id, organizationId);
    if (!pipeline) {
      throw new NotFoundException(`Hiring pipeline '${id}' not found`);
    }
    return pipeline;
  }

  async create(organizationId: string, data: any) {
    return this.repository.create(organizationId, data);
  }

  async update(id: string, organizationId: string, data: any) {
    await this.findById(id, organizationId);
    return this.repository.update(id, organizationId, data);
  }

  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.repository.delete(id, organizationId);
  }

  async createDefaultPipeline(organizationId: string) {
    const defaultStages = [
      { stageName: 'Applied', stageType: StageType.APPLIED, stageOrder: 0, isMandatory: true },
      { stageName: 'Screening', stageType: StageType.SCREENING, stageOrder: 1, isMandatory: true },
      { stageName: 'Assessment', stageType: StageType.ASSESSMENT, stageOrder: 2, isMandatory: false },
      { stageName: 'Technical Interview', stageType: StageType.TECHNICAL_INTERVIEW, stageOrder: 3, isMandatory: true },
      { stageName: 'Manager Interview', stageType: StageType.MANAGER_INTERVIEW, stageOrder: 4, isMandatory: true },
      { stageName: 'HR Interview', stageType: StageType.HR_INTERVIEW, stageOrder: 5, isMandatory: true },
      { stageName: 'Offer', stageType: StageType.OFFER, stageOrder: 6, isMandatory: true },
      { stageName: 'Hired', stageType: StageType.HIRED, stageOrder: 7, isMandatory: true },
      { stageName: 'Rejected', stageType: StageType.REJECTED, stageOrder: 8, isMandatory: false },
      { stageName: 'On Hold', stageType: StageType.ON_HOLD, stageOrder: 9, isMandatory: false },
    ];

    return this.repository.create(organizationId, {
      name: 'Standard Engineering & Business Pipeline',
      description: 'Standard 10-stage hiring pipeline from application to hire/rejection',
      isDefault: true,
      stages: defaultStages,
    });
  }
}
