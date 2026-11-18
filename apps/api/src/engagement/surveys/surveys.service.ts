import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SurveysRepository } from './surveys.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, EnpsCalculationDto } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SurveysService {
  constructor(
    private readonly repository: SurveysRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(organizationId: string, status?: string, type?: string) {
    return this.repository.findAll(organizationId, status, type);
  }

  async findById(organizationId: string, id: string) {
    const survey = await this.repository.findById(organizationId, id);
    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }
    return survey;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Duplicate active survey check
    if (data.status === 'ACTIVE') {
      const existing = await this.repository.findByTitleAndStatus(
        organizationId,
        data.title,
        'ACTIVE',
      );
      if (existing) {
        throw new ConflictException(
          `An active survey with title '${data.title}' already exists`,
        );
      }
    }

    // Calculate eligible employees
    const totalEligible = await this.prisma.employee.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    const survey = await this.repository.create(organizationId, {
      title: data.title,
      description: data.description,
      surveyType: data.surveyType || 'ENGAGEMENT',
      status: data.status || 'DRAFT',
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isAnonymous: data.isAnonymous ?? false,
      audienceType: data.audienceType || 'ALL',
      audienceFilter: data.audienceFilter || null,
      recurrenceFrequency: data.recurrenceFrequency || 'NONE',
      allowAnonymousComments: data.allowAnonymousComments ?? true,
      totalEligibleCount: totalEligible,
      createdBy: userId,
    });

    // Auto-create eNPS question if surveyType is ENPS
    if (survey.surveyType === 'ENPS') {
      await this.repository.addQuestion(organizationId, survey.id, {
        sectionName: 'eNPS',
        questionText:
          'How likely are you to recommend our company as a great place to work to a friend or colleague?',
        questionType: 'ENPS_SCALE',
        ratingScaleMin: 0,
        ratingScaleMax: 10,
        ratingScaleMinLabel: 'Not at all likely',
        ratingScaleMaxLabel: 'Extremely likely',
        isRequired: true,
        displayOrder: 1,
      });

      await this.repository.addQuestion(organizationId, survey.id, {
        sectionName: 'eNPS',
        questionText:
          'What is the primary reason for your score? (Optional feedback)',
        questionType: 'NPS_FOLLOW_UP_COMMENT',
        isRequired: false,
        displayOrder: 2,
      });
    }

    await this.auditService.log({
      action: AuditAction.SURVEY_CREATE,
      entityType: 'EngagementSurvey',
      entityId: survey.id,
      organizationId,
      actorUserId: userId,
      details: {
        title: survey.title,
        surveyType: survey.surveyType,
        isAnonymous: survey.isAnonymous,
      },
      ipAddress,
      userAgent,
    });

    return this.findById(organizationId, survey.id);
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

    const updated = await this.repository.update(organizationId, id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    await this.auditService.log({
      action: AuditAction.SURVEY_UPDATE,
      entityType: 'EngagementSurvey',
      entityId: id,
      organizationId,
      actorUserId: userId,
      details: data,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async publish(
    organizationId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const survey = await this.findById(organizationId, id);

    // Prevent duplicate active survey with same title
    const existingActive = await this.repository.findByTitleAndStatus(
      organizationId,
      survey.title,
      'ACTIVE',
    );
    if (existingActive && existingActive.id !== id) {
      throw new ConflictException(
        `Another active survey with title '${survey.title}' is already running`,
      );
    }

    const totalEligible = await this.prisma.employee.count({
      where: { organizationId, status: 'ACTIVE' },
    });

    const updated = await this.repository.update(organizationId, id, {
      status: 'ACTIVE',
      startDate: survey.startDate || new Date(),
      totalEligibleCount: totalEligible,
    });

    await this.auditService.log({
      action: AuditAction.SURVEY_PUBLISH,
      entityType: 'EngagementSurvey',
      entityId: id,
      organizationId,
      actorUserId: userId,
      details: { title: survey.title },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async close(
    organizationId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const survey = await this.findById(organizationId, id);

    const updated = await this.repository.update(organizationId, id, {
      status: 'CLOSED',
      endDate: new Date(),
    });

    await this.auditService.log({
      action: AuditAction.SURVEY_CLOSE,
      entityType: 'EngagementSurvey',
      entityId: id,
      organizationId,
      actorUserId: userId,
      details: { title: survey.title },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(organizationId: string, id: string) {
    await this.findById(organizationId, id);
    return this.repository.delete(organizationId, id);
  }

  async addQuestion(organizationId: string, surveyId: string, data: any) {
    await this.findById(organizationId, surveyId);
    return this.repository.addQuestion(organizationId, surveyId, data);
  }

  async updateQuestion(
    organizationId: string,
    surveyId: string,
    questionId: string,
    data: any,
  ) {
    await this.findById(organizationId, surveyId);
    return this.repository.updateQuestion(organizationId, questionId, data);
  }

  async deleteQuestion(
    organizationId: string,
    surveyId: string,
    questionId: string,
  ) {
    await this.findById(organizationId, surveyId);
    return this.repository.deleteQuestion(organizationId, questionId);
  }

  async submitResponse(
    organizationId: string,
    surveyId: string,
    employeeId: string,
    answers: any[],
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const survey = await this.findById(organizationId, surveyId);

    if (survey.status !== 'ACTIVE') {
      throw new BadRequestException('This survey is not currently accepting responses');
    }

    // Check duplicate response
    const existing = await this.repository.findResponse(
      organizationId,
      surveyId,
      employeeId,
    );
    if (existing) {
      throw new ConflictException(
        'You have already submitted a response for this survey',
      );
    }

    // Handle anonymity: if survey is anonymous, employeeId is stored to prevent duplicates
    // but sanitized during aggregate reporting
    const response = await this.repository.createResponse(
      organizationId,
      surveyId,
      employeeId,
      answers,
    );

    await this.auditService.log({
      action: AuditAction.SURVEY_RESPONSE_SUBMIT,
      entityType: 'SurveyResponse',
      entityId: response.id,
      organizationId,
      actorUserId: userId,
      details: {
        surveyId,
        isAnonymous: survey.isAnonymous,
        answersCount: answers.length,
      },
      ipAddress,
      userAgent,
    });

    return response;
  }

  async calculateEnps(organizationId: string, surveyId: string): Promise<EnpsCalculationDto> {
    const survey = await this.findById(organizationId, surveyId);

    const responses = await this.repository.getResponsesWithAnswers(
      organizationId,
      surveyId,
    );

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    const scoreCounts: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) scoreCounts[i] = 0;

    const comments: Array<{ score: number; comment: string; date: string }> = [];

    for (const res of responses) {
      let ratingForResponse: number | null = null;
      let commentForResponse: string | null = null;

      for (const ans of res.answers) {
        if (
          ans.surveyQuestion.questionType === 'ENPS_SCALE' ||
          (ans.surveyQuestion.questionType === 'RATING_SCALE' &&
            ans.surveyQuestion.ratingScaleMax === 10)
        ) {
          if (ans.numberValue !== null && ans.numberValue !== undefined) {
            ratingForResponse = Math.round(ans.numberValue);
          }
        }

        if (
          ans.surveyQuestion.questionType === 'NPS_FOLLOW_UP_COMMENT' ||
          ans.surveyQuestion.questionType === 'LONG_TEXT'
        ) {
          if (ans.textValue) {
            commentForResponse = ans.textValue;
          }
        }
      }

      if (ratingForResponse !== null && ratingForResponse >= 0 && ratingForResponse <= 10) {
        scoreCounts[ratingForResponse] = (scoreCounts[ratingForResponse] || 0) + 1;

        if (ratingForResponse >= 9) {
          promoters++;
        } else if (ratingForResponse >= 7) {
          passives++;
        } else {
          detractors++;
        }

        if (commentForResponse) {
          comments.push({
            score: ratingForResponse,
            comment: commentForResponse,
            date: res.submittedAt.toISOString(),
          });
        }
      }
    }

    const total = promoters + passives + detractors;
    const promoterPct = total > 0 ? Math.round((promoters / total) * 100) : 0;
    const passivePct = total > 0 ? Math.round((passives / total) * 100) : 0;
    const detractorPct = total > 0 ? Math.round((detractors / total) * 100) : 0;
    const enpsScore = promoterPct - detractorPct;

    const distribution = Object.entries(scoreCounts).map(([score, count]) => ({
      score: parseInt(score, 10),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return {
      totalResponses: total,
      promotersCount: promoters,
      passivesCount: passives,
      detractorsCount: detractors,
      promoterPercentage: promoterPct,
      passivePercentage: passivePct,
      detractorPercentage: detractorPct,
      enpsScore,
      distribution,
      comments: survey.allowAnonymousComments ? comments : [],
    };
  }

  async getMySurveys(organizationId: string, employeeId: string) {
    const activeSurveys = await this.repository.getActiveSurveysForEmployee(
      organizationId,
      employeeId,
    );

    return activeSurveys.map((s) => ({
      ...s,
      hasResponded: s.responses.length > 0,
      responses: undefined,
    }));
  }
}
