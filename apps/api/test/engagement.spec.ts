import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SurveysService } from '../src/engagement/surveys/surveys.service';
import { SurveysRepository } from '../src/engagement/surveys/surveys.repository';
import { PollsService } from '../src/engagement/polls/polls.service';
import { PollsRepository } from '../src/engagement/polls/polls.repository';
import { RecognitionService } from '../src/engagement/recognition/recognition.service';
import { RecognitionRepository } from '../src/engagement/recognition/recognition.repository';
import { RewardsService } from '../src/engagement/rewards/rewards.service';
import { RewardsRepository } from '../src/engagement/rewards/rewards.repository';
import { BadgesService } from '../src/engagement/badges/badges.service';
import { BadgesRepository } from '../src/engagement/badges/badges.repository';
import { CelebrationsService } from '../src/engagement/celebrations/celebrations.service';
import { CelebrationsRepository } from '../src/engagement/celebrations/celebrations.repository';
import { WellnessService } from '../src/engagement/wellness/wellness.service';
import { WellnessRepository } from '../src/engagement/wellness/wellness.repository';
import { EngagementReportsService } from '../src/engagement/reports/reports.service';
import { EngagementReportsRepository } from '../src/engagement/reports/reports.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

describe('Employee Engagement Module Suite', () => {
  let surveysService: SurveysService;
  let pollsService: PollsService;
  let recognitionService: RecognitionService;
  let rewardsService: RewardsService;
  let badgesService: BadgesService;
  let celebrationsService: CelebrationsService;
  let wellnessService: WellnessService;
  let reportsService: EngagementReportsService;

  const orgId = 'org-engagement-1';
  const otherOrgId = 'org-engagement-2';
  const userId = 'usr-admin-1';
  const emp1Id = 'emp-001';
  const emp2Id = 'emp-002';
  const surveyId = 'srv-001';
  const pollId = 'poll-001';
  const rewardId = 'rew-001';
  const badgeId = 'bdg-001';
  const activityId = 'act-001';

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-001' }),
  };

  const mockPrisma = {
    employee: {
      count: jest.fn().mockResolvedValue(25),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    employeeBadge: {
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(2),
    },
    engagementSurvey: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    poll: {
      count: jest.fn().mockResolvedValue(3),
    },
    recognition: {
      count: jest.fn().mockResolvedValue(12),
      aggregate: jest.fn().mockResolvedValue({ _sum: { pointsAwarded: 500 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    rewardRedemption: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    celebration: {
      count: jest.fn().mockResolvedValue(4),
      findMany: jest.fn().mockResolvedValue([]),
    },
    wellnessActivity: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockSurveysRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByTitleAndStatus: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    findResponse: jest.fn(),
    countResponses: jest.fn(),
    createResponse: jest.fn(),
    getResponsesWithAnswers: jest.fn(),
    getActiveSurveysForEmployee: jest.fn(),
  };

  const mockPollsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findVote: jest.fn(),
    castVote: jest.fn(),
  };

  const mockRecognitionRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    incrementLikes: jest.fn(),
    findAllPrograms: jest.fn(),
    createProgram: jest.fn(),
    findProgramById: jest.fn(),
    getEmployeePointsBalance: jest.fn().mockResolvedValue(350),
  };

  const mockRewardsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findRedemptions: jest.fn(),
    findRedemptionById: jest.fn(),
    countEmployeeRedemptionsForReward: jest.fn().mockResolvedValue(0),
    createRedemption: jest.fn(),
    updateRedemptionStatus: jest.fn(),
  };

  const mockBadgesRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findEmployeeBadges: jest.fn(),
    awardBadge: jest.fn(),
  };

  const mockCelebrationsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    incrementWishes: jest.fn(),
    findExistingCelebration: jest.fn(),
  };

  const mockWellnessRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findParticipation: jest.fn(),
    joinActivity: jest.fn(),
    completeActivity: jest.fn(),
    findEmployeeParticipations: jest.fn(),
  };

  const mockReportsRepo = {
    getEmployeeDirectReports: jest.fn().mockResolvedValue([]),
    getUpcomingCelebrations: jest.fn().mockResolvedValue([]),
    getRecentRecognitions: jest.fn().mockResolvedValue([]),
    getActiveSurveys: jest.fn().mockResolvedValue([]),
    getActivePolls: jest.fn().mockResolvedValue([]),
    getEnpsSurveys: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        { provide: SurveysRepository, useValue: mockSurveysRepo },
        PollsService,
        { provide: PollsRepository, useValue: mockPollsRepo },
        RecognitionService,
        { provide: RecognitionRepository, useValue: mockRecognitionRepo },
        RewardsService,
        { provide: RewardsRepository, useValue: mockRewardsRepo },
        BadgesService,
        { provide: BadgesRepository, useValue: mockBadgesRepo },
        CelebrationsService,
        { provide: CelebrationsRepository, useValue: mockCelebrationsRepo },
        WellnessService,
        { provide: WellnessRepository, useValue: mockWellnessRepo },
        EngagementReportsService,
        { provide: EngagementReportsRepository, useValue: mockReportsRepo },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    surveysService = module.get<SurveysService>(SurveysService);
    pollsService = module.get<PollsService>(PollsService);
    recognitionService = module.get<RecognitionService>(RecognitionService);
    rewardsService = module.get<RewardsService>(RewardsService);
    badgesService = module.get<BadgesService>(BadgesService);
    celebrationsService = module.get<CelebrationsService>(CelebrationsService);
    wellnessService = module.get<WellnessService>(WellnessService);
    reportsService = module.get<EngagementReportsService>(EngagementReportsService);
  });

  describe('1. Surveys & eNPS Management', () => {
    it('creates an eNPS survey with auto-generated scale and comment questions', async () => {
      mockSurveysRepo.findByTitleAndStatus.mockResolvedValue(null);
      mockSurveysRepo.create.mockResolvedValue({
        id: surveyId,
        title: 'Q4 2026 eNPS Pulse',
        surveyType: 'ENPS',
        status: 'DRAFT',
        isAnonymous: true,
      });
      mockSurveysRepo.findById.mockResolvedValue({
        id: surveyId,
        title: 'Q4 2026 eNPS Pulse',
        surveyType: 'ENPS',
        status: 'DRAFT',
        questions: [
          { id: 'q-1', questionType: 'ENPS_SCALE', ratingScaleMin: 0, ratingScaleMax: 10 },
          { id: 'q-2', questionType: 'NPS_FOLLOW_UP_COMMENT' },
        ],
      });

      const res = await surveysService.create(
        orgId,
        {
          title: 'Q4 2026 eNPS Pulse',
          surveyType: 'ENPS',
          isAnonymous: true,
        },
        userId,
      );

      expect(res.id).toBe(surveyId);
      expect(mockSurveysRepo.addQuestion).toHaveBeenCalledTimes(2);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.SURVEY_CREATE }),
      );
    });

    it('rejects duplicate active survey creation with ConflictException', async () => {
      mockSurveysRepo.findByTitleAndStatus.mockResolvedValue({
        id: 'srv-existing',
        title: 'Annual Engagement Survey',
        status: 'ACTIVE',
      });

      await expect(
        surveysService.create(
          orgId,
          {
            title: 'Annual Engagement Survey',
            status: 'ACTIVE',
          },
          userId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('transitions survey status through lifecycle: DRAFT -> ACTIVE -> CLOSED', async () => {
      mockSurveysRepo.findById.mockResolvedValue({
        id: surveyId,
        title: 'Pulse Survey',
        status: 'DRAFT',
      });
      mockSurveysRepo.findByTitleAndStatus.mockResolvedValue(null);
      mockSurveysRepo.update.mockResolvedValue({
        id: surveyId,
        status: 'ACTIVE',
      });

      const published = await surveysService.publish(orgId, surveyId, userId);
      expect(published.status).toBe('ACTIVE');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.SURVEY_PUBLISH }),
      );

      mockSurveysRepo.update.mockResolvedValue({
        id: surveyId,
        status: 'CLOSED',
      });
      const closed = await surveysService.close(orgId, surveyId, userId);
      expect(closed.status).toBe('CLOSED');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.SURVEY_CLOSE }),
      );
    });
  });

  describe('2. Survey Responses & Anonymity', () => {
    it('submits a response and blocks duplicate response from same employee', async () => {
      mockSurveysRepo.findById.mockResolvedValue({
        id: surveyId,
        status: 'ACTIVE',
        isAnonymous: true,
      });
      mockSurveysRepo.findResponse.mockResolvedValue(null);
      mockSurveysRepo.createResponse.mockResolvedValue({
        id: 'resp-001',
        surveyId,
        employeeId: emp1Id,
        status: 'SUBMITTED',
      });

      const response = await surveysService.submitResponse(
        orgId,
        surveyId,
        emp1Id,
        [{ surveyQuestionId: 'q-1', numberValue: 9 }],
        userId,
      );

      expect(response.id).toBe('resp-001');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.SURVEY_RESPONSE_SUBMIT }),
      );

      // Attempt second submission
      mockSurveysRepo.findResponse.mockResolvedValue({ id: 'resp-001' });
      await expect(
        surveysService.submitResponse(
          orgId,
          surveyId,
          emp1Id,
          [{ surveyQuestionId: 'q-1', numberValue: 10 }],
          userId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('blocks response submission when survey is not active', async () => {
      mockSurveysRepo.findById.mockResolvedValue({
        id: surveyId,
        status: 'CLOSED',
      });

      await expect(
        surveysService.submitResponse(orgId, surveyId, emp1Id, [], userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. eNPS Engine Calculation', () => {
    it('correctly calculates eNPS: % Promoters (9-10) - % Detractors (0-6)', async () => {
      mockSurveysRepo.findById.mockResolvedValue({
        id: surveyId,
        allowAnonymousComments: true,
      });

      // 4 Promoters (ratings 10, 10, 9, 9)
      // 2 Passives (ratings 8, 7)
      // 2 Detractors (ratings 6, 2)
      // Total = 8 responses.
      // Promoters: 4/8 = 50%
      // Passives: 2/8 = 25%
      // Detractors: 2/8 = 25%
      // eNPS = 50 - 25 = +25
      const mockResponses = [
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 10 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 10 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 9 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 9 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 8 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 7 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 6 }] },
        { submittedAt: new Date(), answers: [{ surveyQuestion: { questionType: 'ENPS_SCALE' }, numberValue: 2, textValue: 'Need better tools' }] },
      ];

      mockSurveysRepo.getResponsesWithAnswers.mockResolvedValue(mockResponses);

      const result = await surveysService.calculateEnps(orgId, surveyId);

      expect(result.totalResponses).toBe(8);
      expect(result.promotersCount).toBe(4);
      expect(result.passivesCount).toBe(2);
      expect(result.detractorsCount).toBe(2);
      expect(result.promoterPercentage).toBe(50);
      expect(result.passivePercentage).toBe(25);
      expect(result.detractorPercentage).toBe(25);
      expect(result.enpsScore).toBe(25);
    });

    it('returns score 0 when there are zero responses', async () => {
      mockSurveysRepo.findById.mockResolvedValue({
        id: surveyId,
        allowAnonymousComments: true,
      });
      mockSurveysRepo.getResponsesWithAnswers.mockResolvedValue([]);

      const result = await surveysService.calculateEnps(orgId, surveyId);

      expect(result.totalResponses).toBe(0);
      expect(result.enpsScore).toBe(0);
      expect(result.promoterPercentage).toBe(0);
      expect(result.detractorPercentage).toBe(0);
    });
  });

  describe('4. Quick Polls Voting & Duplicate Prevention', () => {
    it('creates a poll with options and tallies vote percentages', async () => {
      mockPollsRepo.create.mockResolvedValue({
        id: pollId,
        title: 'Friday Social',
        question: 'What activity should we do this Friday?',
        totalVotesCount: 0,
      });
      mockPollsRepo.findById.mockResolvedValue({
        id: pollId,
        title: 'Friday Social',
        status: 'ACTIVE',
        totalVotesCount: 1,
        options: [
          { id: 'opt-1', optionText: 'Board Games', votesCount: 1 },
          { id: 'opt-2', optionText: 'Pizza Party', votesCount: 0 },
        ],
      });
      mockPollsRepo.findVote.mockResolvedValue(null);
      mockPollsRepo.castVote.mockResolvedValue({ id: 'vote-001' });

      const voteRes = await pollsService.vote(
        orgId,
        pollId,
        emp1Id,
        'opt-1',
        undefined,
        userId,
      );

      expect(voteRes.hasVoted).toBe(false);
      expect(voteRes.options[0].percentage).toBe(100);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.POLL_VOTE }),
      );
    });

    it('blocks duplicate votes from the same employee', async () => {
      mockPollsRepo.findById.mockResolvedValue({
        id: pollId,
        status: 'ACTIVE',
        options: [],
      });
      mockPollsRepo.findVote.mockResolvedValue({ id: 'existing-vote' });

      await expect(
        pollsService.vote(orgId, pollId, emp1Id, 'opt-1', undefined, userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('5. Recognition, Points & Self-Recognition Prevention', () => {
    it('blocks employees from giving recognition to themselves with BadRequestException', async () => {
      await expect(
        recognitionService.giveRecognition(
          orgId,
          emp1Id, // sender
          {
            receiverId: emp1Id, // same recipient!
            category: 'TEAMWORK',
            message: 'I did a great job today!',
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('gives recognition from peer to peer and writes audit log', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: emp2Id,
        organizationId: orgId,
        status: 'ACTIVE',
      });
      mockRecognitionRepo.create.mockResolvedValue({
        id: 'rec-001',
        senderId: emp1Id,
        receiverId: emp2Id,
        category: 'TEAMWORK',
        pointsAwarded: 50,
        status: 'APPROVED',
      });

      const recognition = await recognitionService.giveRecognition(
        orgId,
        emp1Id,
        {
          receiverId: emp2Id,
          category: 'TEAMWORK',
          message: 'Thank you for helping with the deployment!',
          pointsAwarded: 50,
        },
        userId,
      );

      expect(recognition.id).toBe('rec-001');
      expect(recognition.status).toBe('APPROVED');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.RECOGNITION_GIVE }),
      );
    });

    it('supports approval workflow when recognition program requires approval', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: emp2Id,
        organizationId: orgId,
        status: 'ACTIVE',
      });
      mockRecognitionRepo.findProgramById.mockResolvedValue({
        id: 'prog-001',
        requiresApproval: true,
        defaultPoints: 100,
      });
      mockRecognitionRepo.create.mockResolvedValue({
        id: 'rec-002',
        senderId: emp1Id,
        receiverId: emp2Id,
        status: 'PENDING',
        pointsAwarded: 100,
      });

      const recognition = await recognitionService.giveRecognition(
        orgId,
        emp1Id,
        {
          receiverId: emp2Id,
          category: 'LEADERSHIP',
          message: 'Excellent guidance!',
          programId: 'prog-001',
        },
        userId,
      );

      expect(recognition.status).toBe('PENDING');

      // Approving recognition
      mockRecognitionRepo.findById.mockResolvedValue({
        id: 'rec-002',
        receiverId: emp2Id,
        pointsAwarded: 100,
      });
      mockRecognitionRepo.update.mockResolvedValue({
        id: 'rec-002',
        status: 'APPROVED',
      });

      const approved = await recognitionService.approve(orgId, 'rec-002', userId);
      expect(approved.status).toBe('APPROVED');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.RECOGNITION_APPROVE }),
      );
    });
  });

  describe('6. Rewards Catalog & Points Redemptions', () => {
    it('allows redemption when points balance is sufficient', async () => {
      mockRewardsRepo.findById.mockResolvedValue({
        id: rewardId,
        title: '$50 Amazon Voucher',
        pointsCost: 200,
        quantityAvailable: 10,
        maxRedemptionsPerEmployee: 2,
        isActive: true,
      });
      mockRecognitionRepo.getEmployeePointsBalance.mockResolvedValue(300); // 300 >= 200
      mockRewardsRepo.countEmployeeRedemptionsForReward.mockResolvedValue(0);
      mockRewardsRepo.createRedemption.mockResolvedValue({
        id: 'red-001',
        rewardId,
        employeeId: emp1Id,
        pointsSpent: 200,
        status: 'PENDING',
      });

      const redemption = await rewardsService.redeem(
        orgId,
        rewardId,
        emp1Id,
        'Gift card for holiday',
        userId,
      );

      expect(redemption.id).toBe('red-001');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REWARD_REDEEM }),
      );
    });

    it('rejects redemption with BadRequestException when points balance is insufficient', async () => {
      mockRewardsRepo.findById.mockResolvedValue({
        id: rewardId,
        title: 'iPad Pro',
        pointsCost: 2000,
        quantityAvailable: 5,
        maxRedemptionsPerEmployee: 1,
        isActive: true,
      });
      mockRecognitionRepo.getEmployeePointsBalance.mockResolvedValue(150); // 150 < 2000

      await expect(
        rewardsService.redeem(orgId, rewardId, emp1Id, undefined, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('7. Badges Management & Awarding', () => {
    it('creates a badge and rejects duplicate badge names with ConflictException', async () => {
      mockBadgesRepo.findByName.mockResolvedValue(null);
      mockBadgesRepo.create.mockResolvedValue({
        id: badgeId,
        name: 'Team Player',
        color: '#10B981',
      });

      const badge = await badgesService.create(
        orgId,
        { name: 'Team Player', color: '#10B981' },
        userId,
      );
      expect(badge.id).toBe(badgeId);

      mockBadgesRepo.findByName.mockResolvedValue({ id: badgeId, name: 'Team Player' });
      await expect(
        badgesService.create(orgId, { name: 'Team Player' }, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('awards badge to an employee and logs audit event', async () => {
      mockBadgesRepo.findById.mockResolvedValue({ id: badgeId, name: 'Innovator' });
      mockBadgesRepo.awardBadge.mockResolvedValue({
        id: 'emp-badge-001',
        badgeId,
        employeeId: emp1Id,
      });

      const awarded = await badgesService.awardBadge(
        orgId,
        badgeId,
        emp1Id,
        'Patent filing',
        userId,
      );

      expect(awarded.id).toBe('emp-badge-001');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BADGE_AWARD }),
      );
    });
  });

  describe('8. Automated Celebrations Engine', () => {
    it('generates birthday and milestone work anniversary celebrations for active employees', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        {
          id: emp1Id,
          firstName: 'Alice',
          lastName: 'Smith',
          dateOfBirth: new Date(1992, 4, 15),
          dateOfJoining: new Date(2021, 8, 1), // 5 years milestone for 2026
        },
      ]);
      mockCelebrationsRepo.findExistingCelebration.mockResolvedValue(null);
      mockCelebrationsRepo.create.mockResolvedValue({ id: 'cel-001' });

      const syncResult = await celebrationsService.syncCelebrations(orgId, 2026, userId);

      expect(syncResult.birthdaysCreated).toBe(1);
      expect(syncResult.anniversariesCreated).toBe(1);
      expect(syncResult.totalCreated).toBe(2);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CELEBRATION_SYNC }),
      );
    });

    it('increments wishes count on congratulations reaction', async () => {
      mockCelebrationsRepo.findById.mockResolvedValue({ id: 'cel-001' });
      mockCelebrationsRepo.incrementWishes.mockResolvedValue({ id: 'cel-001', wishesCount: 5 });

      const res = await celebrationsService.wish(orgId, 'cel-001');
      expect(res.wishesCount).toBe(5);
    });
  });

  describe('9. Wellness Activities & Capacity Limits', () => {
    it('joins wellness activity and respects max participants capacity', async () => {
      mockWellnessRepo.findById.mockResolvedValue({
        id: activityId,
        title: 'Step Challenge',
        status: 'ACTIVE',
        maxParticipants: 20,
        enrolledCount: 15,
        participations: [],
      });
      mockWellnessRepo.findParticipation.mockResolvedValue(null);
      mockWellnessRepo.joinActivity.mockResolvedValue({
        id: 'part-001',
        activityId,
        employeeId: emp1Id,
      });

      const joined = await wellnessService.joinActivity(orgId, activityId, emp1Id, userId);
      expect(joined.id).toBe('part-001');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.WELLNESS_ACTIVITY_JOIN }),
      );

      // Capacity reached test
      mockWellnessRepo.findById.mockResolvedValue({
        id: activityId,
        title: 'Step Challenge',
        status: 'ACTIVE',
        maxParticipants: 20,
        enrolledCount: 20, // Full!
        participations: [],
      });
      await expect(
        wellnessService.joinActivity(orgId, activityId, emp2Id, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('marks activity completed and credits points to employee', async () => {
      mockWellnessRepo.findById.mockResolvedValue({
        id: activityId,
        title: 'Yoga',
        pointsReward: 75,
        participations: [],
      });
      mockWellnessRepo.findParticipation.mockResolvedValue({
        id: 'part-001',
        status: 'REGISTERED',
      });
      mockWellnessRepo.completeActivity.mockResolvedValue({
        id: 'part-001',
        status: 'COMPLETED',
        pointsAwarded: 75,
      });

      const res = await wellnessService.completeActivity(orgId, activityId, emp1Id, userId);
      expect(res.status).toBe('COMPLETED');
      expect(res.pointsAwarded).toBe(75);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.WELLNESS_ACTIVITY_COMPLETE }),
      );
    });
  });

  describe('10. Reports & CSV Export', () => {
    it('generates summary reports and formatted CSV exports', async () => {
      const summary = await reportsService.getOrgSummary(orgId);
      expect(summary.totalSurveysCount).toBe(5);
      expect(summary.activePollsCount).toBe(3);

      const csv = await reportsService.exportData(orgId, 'surveys', userId);
      expect(csv).toContain('ID,Title,Type,Status');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ENGAGEMENT_REPORT_EXPORT }),
      );
    });
  });
});
