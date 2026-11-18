import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PipelinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.hiringPipeline.findMany({
      where: { organizationId },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.hiringPipeline.findFirst({
      where: { id, organizationId },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
      },
    });
  }

  async findDefault(organizationId: string) {
    return this.prisma.hiringPipeline.findFirst({
      where: { organizationId, isDefault: true },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
      },
    });
  }

  async create(organizationId: string, data: any) {
    const { stages, ...pipelineData } = data;
    return this.prisma.$transaction(async (tx) => {
      if (pipelineData.isDefault) {
        await tx.hiringPipeline.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const pipeline = await tx.hiringPipeline.create({
        data: {
          ...pipelineData,
          organizationId,
        },
      });

      if (stages && stages.length > 0) {
        await tx.hiringPipelineStage.createMany({
          data: stages.map((stage: any, index: number) => ({
            organizationId,
            hiringPipelineId: pipeline.id,
            stageName: stage.stageName,
            stageType: stage.stageType,
            stageOrder: stage.stageOrder ?? index,
            isMandatory: stage.isMandatory ?? true,
            interviewerIds: stage.interviewerIds || [],
            assessmentRequired: stage.assessmentRequired ?? false,
          })),
        });
      }

      return tx.hiringPipeline.findUnique({
        where: { id: pipeline.id },
        include: {
          stages: {
            orderBy: { stageOrder: 'asc' },
          },
        },
      });
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const { stages, ...pipelineData } = data;
    return this.prisma.$transaction(async (tx) => {
      if (pipelineData.isDefault) {
        await tx.hiringPipeline.updateMany({
          where: { organizationId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      await tx.hiringPipeline.update({
        where: { id },
        data: pipelineData,
      });

      if (stages) {
        await tx.hiringPipelineStage.deleteMany({
          where: { hiringPipelineId: id },
        });

        await tx.hiringPipelineStage.createMany({
          data: stages.map((stage: any, index: number) => ({
            organizationId,
            hiringPipelineId: id,
            stageName: stage.stageName,
            stageType: stage.stageType,
            stageOrder: stage.stageOrder ?? index,
            isMandatory: stage.isMandatory ?? true,
            interviewerIds: stage.interviewerIds || [],
            assessmentRequired: stage.assessmentRequired ?? false,
          })),
        });
      }

      return tx.hiringPipeline.findUnique({
        where: { id },
        include: {
          stages: {
            orderBy: { stageOrder: 'asc' },
          },
        },
      });
    });
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.hiringPipeline.deleteMany({
      where: { id, organizationId },
    });
  }
}
