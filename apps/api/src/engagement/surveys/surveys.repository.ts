import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SurveysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string, type?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    if (type) where.surveyType = type;

    return this.prisma.engagementSurvey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.engagementSurvey.findFirst({
      where: { id, organizationId },
      include: {
        questions: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findByTitleAndStatus(organizationId: string, title: string, status: string) {
    return this.prisma.engagementSurvey.findFirst({
      where: {
        organizationId,
        title: { equals: title, mode: 'insensitive' },
        status,
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.engagementSurvey.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.engagementSurvey.update({
      where: { id },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.engagementSurvey.delete({
      where: { id },
    });
  }

  async addQuestion(organizationId: string, surveyId: string, data: any) {
    return this.prisma.surveyQuestion.create({
      data: {
        ...data,
        surveyId,
        organizationId,
      },
    });
  }

  async updateQuestion(organizationId: string, questionId: string, data: any) {
    return this.prisma.surveyQuestion.update({
      where: { id: questionId },
      data,
    });
  }

  async deleteQuestion(organizationId: string, questionId: string) {
    return this.prisma.surveyQuestion.delete({
      where: { id: questionId },
    });
  }

  async findResponse(organizationId: string, surveyId: string, employeeId: string) {
    return this.prisma.surveyResponse.findFirst({
      where: {
        organizationId,
        surveyId,
        employeeId,
      },
    });
  }

  async countResponses(organizationId: string, surveyId: string) {
    return this.prisma.surveyResponse.count({
      where: { organizationId, surveyId },
    });
  }

  async createResponse(
    organizationId: string,
    surveyId: string,
    employeeId: string | null,
    answers: Array<{
      surveyQuestionId: string;
      textValue?: string;
      numberValue?: number;
      selectedOptions?: any;
      booleanValue?: boolean;
      dateValue?: Date;
      fileUrl?: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const response = await tx.surveyResponse.create({
        data: {
          organizationId,
          surveyId,
          employeeId,
          status: 'SUBMITTED',
        },
      });

      if (answers && answers.length > 0) {
        await tx.surveyAnswer.createMany({
          data: answers.map((a) => ({
            organizationId,
            surveyResponseId: response.id,
            surveyQuestionId: a.surveyQuestionId,
            textValue: a.textValue,
            numberValue: a.numberValue,
            selectedOptions: a.selectedOptions,
            booleanValue: a.booleanValue,
            dateValue: a.dateValue,
            fileUrl: a.fileUrl,
          })),
        });
      }

      await tx.engagementSurvey.update({
        where: { id: surveyId },
        data: {
          totalResponsesCount: { increment: 1 },
        },
      });

      return response;
    });
  }

  async getResponsesWithAnswers(organizationId: string, surveyId: string) {
    return this.prisma.surveyResponse.findMany({
      where: { organizationId, surveyId },
      include: {
        answers: {
          include: {
            surveyQuestion: true,
          },
        },
      },
    });
  }

  async getActiveSurveysForEmployee(organizationId: string, employeeId: string) {
    const activeSurveys = await this.prisma.engagementSurvey.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        responses: {
          where: { employeeId },
          select: { id: true, submittedAt: true },
        },
        questions: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return activeSurveys;
  }
}
