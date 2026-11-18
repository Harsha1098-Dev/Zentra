import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PipelinesService } from '../src/recruitment/pipelines/pipelines.service';
import { PipelinesRepository } from '../src/recruitment/pipelines/pipelines.repository';
import { JobOpeningsService } from '../src/recruitment/job-openings/job-openings.service';
import { JobOpeningsRepository } from '../src/recruitment/job-openings/job-openings.repository';
import { CandidatesService } from '../src/recruitment/candidates/candidates.service';
import { CandidatesRepository } from '../src/recruitment/candidates/candidates.repository';
import { ApplicationsService } from '../src/recruitment/applications/applications.service';
import { ApplicationsRepository } from '../src/recruitment/applications/applications.repository';
import { InterviewsService } from '../src/recruitment/interviews/interviews.service';
import { InterviewsRepository } from '../src/recruitment/interviews/interviews.repository';
import { OffersService } from '../src/recruitment/offers/offers.service';
import { OffersRepository } from '../src/recruitment/offers/offers.repository';
import { ReferralsService } from '../src/recruitment/referrals/referrals.service';
import { ReferralsRepository } from '../src/recruitment/referrals/referrals.repository';
import { ReportsService } from '../src/recruitment/reports/reports.service';
import { ReportsRepository } from '../src/recruitment/reports/reports.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { EmailService } from '../src/email/email.service';
import {
  AuditAction,
  JobOpeningStatus,
  JobPublishedStatus,
  CandidateStatus,
  ApplicationStatus,
  StageType,
  InterviewType,
  InterviewStatus,
  InterviewRecommendation,
  OfferStatus,
  CandidateSourceType,
} from '@zentra/shared-types';

describe('Recruitment & ATS Module Suite', () => {
  let pipelinesService: PipelinesService;
  let jobOpeningsService: JobOpeningsService;
  let candidatesService: CandidatesService;
  let applicationsService: ApplicationsService;
  let interviewsService: InterviewsService;
  let offersService: OffersService;
  let referralsService: ReferralsService;
  let reportsService: ReportsService;

  const orgId = 'org-recruitment-test';
  const userId = 'usr-recruiter-1';
  const candidateId = 'cand-001';
  const jobId = 'job-001';
  const appId = 'app-001';
  const interviewId = 'int-001';
  const offerId = 'off-001';

  const mockPrisma: any = {
    $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    hiringPipeline: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    hiringPipelineStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    jobOpening: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    jobOpeningStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    candidate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    candidateDocument: {
      create: jest.fn(),
    },
    recruitmentNote: {
      create: jest.fn(),
    },
    jobApplication: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    applicationStageHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    interview: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    interviewFeedback: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    offer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    employeeReferral: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
    designation: {
      findFirst: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    organizationMembership: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    userRole: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    employmentHistory: {
      create: jest.fn(),
    },
    onboardingFlow: {
      findFirst: jest.fn(),
    },
    onboardingRun: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(true),
  };

  const mockEmailService = {
    sendNotification: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelinesService,
        PipelinesRepository,
        JobOpeningsService,
        JobOpeningsRepository,
        CandidatesService,
        CandidatesRepository,
        ApplicationsService,
        ApplicationsRepository,
        InterviewsService,
        InterviewsRepository,
        OffersService,
        OffersRepository,
        ReferralsService,
        ReferralsRepository,
        ReportsService,
        ReportsRepository,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    pipelinesService = module.get<PipelinesService>(PipelinesService);
    jobOpeningsService = module.get<JobOpeningsService>(JobOpeningsService);
    candidatesService = module.get<CandidatesService>(CandidatesService);
    applicationsService = module.get<ApplicationsService>(ApplicationsService);
    interviewsService = module.get<InterviewsService>(InterviewsService);
    offersService = module.get<OffersService>(OffersService);
    referralsService = module.get<ReferralsService>(ReferralsService);
    reportsService = module.get<ReportsService>(ReportsService);
  });

  describe('1. Hiring Pipelines & Default Stages', () => {
    it('should create default pipeline with 10 standard hiring stages', async () => {
      mockPrisma.hiringPipeline.findFirst.mockResolvedValue(null);
      mockPrisma.hiringPipeline.create.mockResolvedValue({
        id: 'pipe-default',
        organizationId: orgId,
        name: 'Standard Hiring Pipeline',
        isDefault: true,
      });
      mockPrisma.hiringPipeline.findUnique.mockResolvedValue({
        id: 'pipe-default',
        organizationId: orgId,
        name: 'Standard Hiring Pipeline',
        isDefault: true,
        stages: Array.from({ length: 10 }).map((_, i) => ({ id: `stg-${i}`, stageOrder: i })),
      });

      const res = await pipelinesService.createDefaultPipeline(orgId);

      expect(mockPrisma.hiringPipeline.create).toHaveBeenCalled();
      expect(mockPrisma.hiringPipelineStage.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ stageName: 'Applied', stageType: 'APPLIED' }),
            expect.objectContaining({ stageName: 'Screening', stageType: 'SCREENING' }),
            expect.objectContaining({ stageName: 'Technical Interview', stageType: 'TECHNICAL_INTERVIEW' }),
            expect.objectContaining({ stageName: 'Hired', stageType: 'HIRED' }),
            expect.objectContaining({ stageName: 'Rejected', stageType: 'REJECTED' }),
          ]),
        }),
      );
      expect(res?.stages.length).toBe(10);
    });

    it('should create custom hiring pipeline', async () => {
      mockPrisma.hiringPipeline.create.mockResolvedValue({
        id: 'pipe-custom',
        organizationId: orgId,
        name: 'Engineering Pipeline',
      });
      mockPrisma.hiringPipeline.findUnique.mockResolvedValue({
        id: 'pipe-custom',
        name: 'Engineering Pipeline',
        stages: [{ stageName: 'Application Review', stageType: 'APPLIED', stageOrder: 0 }],
      });

      const res = await pipelinesService.create(orgId, {
        name: 'Engineering Pipeline',
        stages: [{ stageName: 'Application Review', stageType: 'APPLIED', stageOrder: 0 }],
      });

      expect(res?.name).toBe('Engineering Pipeline');
    });
  });

  describe('2. Job Openings Management', () => {
    it('should validate experience and salary bounds on job creation', async () => {
      // Experience min > max
      await expect(
        jobOpeningsService.create(
          orgId,
          {
            title: 'Senior Engineer',
            jobCode: 'ENG-001',
            departmentId: 'dept-1',
            designationId: 'desig-1',
            locationId: 'loc-1',
            experienceMinYears: 5,
            experienceMaxYears: 2,
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);

      // Salary min > max
      await expect(
        jobOpeningsService.create(
          orgId,
          {
            title: 'Senior Engineer',
            jobCode: 'ENG-001',
            departmentId: 'dept-1',
            designationId: 'desig-1',
            locationId: 'loc-1',
            salaryMin: 1500000,
            salaryMax: 1000000,
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce unique title and jobCode within the tenant', async () => {
      mockPrisma.jobOpening.findFirst
        .mockResolvedValueOnce({ id: 'job-existing', title: 'Tech Lead' }) // duplicate title check
        .mockResolvedValueOnce(null);

      await expect(
        jobOpeningsService.create(
          orgId,
          {
            title: 'Tech Lead',
            jobCode: 'TECH-001',
            departmentId: 'dept-1',
            designationId: 'desig-1',
            locationId: 'loc-1',
          },
          userId,
        ),
      ).rejects.toThrow(/already exists/);
    });

    it('should create job opening and initialize stages', async () => {
      mockPrisma.jobOpening.findFirst.mockResolvedValue(null);
      mockPrisma.department.findFirst.mockResolvedValue({ id: 'dept-1' });
      mockPrisma.designation.findFirst.mockResolvedValue({ id: 'desig-1' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1' });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp-hm', firstName: 'Jane', lastName: 'Doe' });
      mockPrisma.hiringPipeline.findFirst.mockResolvedValue({
        id: 'pipe-1',
        stages: [
          { stageName: 'Applied', stageType: 'APPLIED', stageOrder: 0, isMandatory: true },
          { stageName: 'Offer', stageType: 'OFFER', stageOrder: 1, isMandatory: true },
        ],
      });

      const mockJob = {
        id: jobId,
        title: 'Backend Developer',
        jobCode: 'BACK-01',
        organizationId: orgId,
        stages: [{ id: 'stg-1', stageName: 'Applied' }],
      };
      mockPrisma.jobOpening.create.mockResolvedValue(mockJob);
      mockPrisma.jobOpening.findUniqueOrThrow.mockResolvedValue(mockJob);

      const res = await jobOpeningsService.create(
        orgId,
        {
          title: 'Backend Developer',
          jobCode: 'BACK-01',
          departmentId: 'dept-1',
          designationId: 'desig-1',
          locationId: 'loc-1',
          hiringManagerId: 'emp-hm',
          pipelineId: 'pipe-1',
        },
        userId,
      );

      expect(res.id).toBe(jobId);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.JOB_OPENING_CREATE }),
      );
    });

    it('should prevent closing job opening if active applications exist and force is not set', async () => {
      mockPrisma.jobOpening.findFirst.mockResolvedValue({
        id: jobId,
        organizationId: orgId,
        jobStatus: JobOpeningStatus.OPEN,
      });
      mockPrisma.jobApplication.count.mockResolvedValue(3); // 3 active applications

      await expect(
        jobOpeningsService.close(jobId, orgId, { forceClose: false }, userId),
      ).rejects.toThrow(/3 active candidate applications/i);
    });

    it('should publish job opening to internal, external, or both', async () => {
      mockPrisma.jobOpening.findFirst.mockResolvedValue({
        id: jobId,
        organizationId: orgId,
        title: 'Full Stack Engineer',
        description: 'Engineering role description',
        departmentId: 'dept-1',
        designationId: 'desig-1',
        locationId: 'loc-1',
        jobStatus: JobOpeningStatus.DRAFT,
        stages: [{ id: 'stg-1', stageName: 'Applied' }],
      });
      mockPrisma.jobOpening.update.mockResolvedValue({
        id: jobId,
        organizationId: orgId,
        jobStatus: JobOpeningStatus.OPEN,
        publishedStatus: JobPublishedStatus.BOTH,
      });

      const res = await jobOpeningsService.publish(
        jobId,
        orgId,
        { publishedStatus: JobPublishedStatus.BOTH },
        userId,
      );

      expect(res.jobStatus).toBe(JobOpeningStatus.OPEN);
      expect(res.publishedStatus).toBe(JobPublishedStatus.BOTH);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.JOB_OPENING_PUBLISH }),
      );
    });
  });

  describe('3. Candidate Management', () => {
    it('should prevent creating candidate with duplicate email in the same tenant', async () => {
      mockPrisma.candidate.findFirst.mockResolvedValue({
        id: 'existing-cand',
        email: 'alice@example.com',
      });

      await expect(
        candidatesService.create(
          orgId,
          {
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
            phone: '9876543210',
          },
          userId,
        ),
      ).rejects.toThrow(/already exists in this organization/);
    });

    it('should create candidate and log audit record', async () => {
      mockPrisma.candidate.findFirst.mockResolvedValue(null);
      mockPrisma.candidate.create.mockResolvedValue({
        id: candidateId,
        organizationId: orgId,
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: '9876543210',
        candidateStatus: CandidateStatus.NEW,
      });

      const cand = await candidatesService.create(
        orgId,
        {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          phone: '9876543210',
        },
        userId,
      );

      expect(cand.id).toBe(candidateId);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CANDIDATE_CREATE,
          resource: 'Candidate',
          resourceId: candidateId,
        }),
      );
    });

    it('should upload candidate resume and documents', async () => {
      mockPrisma.candidate.findFirst.mockResolvedValue({ id: candidateId, organizationId: orgId });
      mockPrisma.candidate.update.mockResolvedValue({
        id: candidateId,
        resumeUrl: 'https://s3.aws.com/resumes/alice.pdf',
      });
      mockPrisma.candidateDocument.create.mockResolvedValue({
        id: 'doc-1',
        candidateId,
        documentType: 'PORTFOLIO',
        documentName: 'Portfolio.pdf',
        documentUrl: 'https://s3.aws.com/alice-portfolio.pdf',
      });

      const updated = await candidatesService.uploadResume(
        candidateId,
        orgId,
        'https://s3.aws.com/resumes/alice.pdf',
        userId,
      );
      expect(updated.resumeUrl).toBe('https://s3.aws.com/resumes/alice.pdf');

      const doc = await candidatesService.addDocument(
        candidateId,
        orgId,
        {
          documentType: 'PORTFOLIO',
          documentName: 'Portfolio.pdf',
          documentUrl: 'https://s3.aws.com/alice-portfolio.pdf',
        },
        userId,
      );
      expect(doc.id).toBe('doc-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CANDIDATE_DOCUMENT_UPLOAD }),
      );
    });
  });

  describe('4. Job Applications & Screening Pipeline', () => {
    it('should create application and prevent duplicate active application for same job', async () => {
      mockPrisma.jobOpening.findFirst.mockResolvedValue({
        id: jobId,
        organizationId: orgId,
        jobStatus: JobOpeningStatus.OPEN,
        stages: [
          { id: 'stg-applied', stageName: 'Applied', stageType: StageType.APPLIED, stageOrder: 0 },
        ],
      });
      mockPrisma.candidate.findFirst.mockResolvedValue({
        id: candidateId,
        firstName: 'Alice',
        email: 'alice@example.com',
      });

      // Existing application found
      mockPrisma.jobApplication.findFirst.mockResolvedValueOnce({ id: 'app-existing' });

      await expect(
        applicationsService.create(orgId, { jobOpeningId: jobId, candidateId }, userId),
      ).rejects.toThrow(/already exists for this candidate/i);

      // No existing application
      mockPrisma.jobApplication.findFirst.mockResolvedValueOnce(null);
      const mockCreatedApp = {
        id: appId,
        organizationId: orgId,
        jobOpeningId: jobId,
        candidateId,
        applicationStatus: ApplicationStatus.APPLIED,
      };
      mockPrisma.jobApplication.create.mockResolvedValue(mockCreatedApp);
      mockPrisma.jobApplication.findUniqueOrThrow.mockResolvedValue(mockCreatedApp);

      const app = await applicationsService.create(
        orgId,
        { jobOpeningId: jobId, candidateId },
        userId,
      );

      expect(app.id).toBe(appId);
      expect(mockEmailService.sendNotification).toHaveBeenCalledWith(
        'alice@example.com',
        expect.stringContaining('Application Received'),
        expect.any(String),
      );
    });

    it('should record stage history on stage movement and prevent backward movement without permission', async () => {
      const stages = [
        { id: 'stg-1', stageName: 'Applied', stageOrder: 0 },
        { id: 'stg-2', stageName: 'Screening', stageOrder: 1 },
        { id: 'stg-3', stageName: 'Technical Interview', stageOrder: 2 },
      ];

      mockPrisma.jobApplication.findFirst.mockResolvedValue({
        id: appId,
        organizationId: orgId,
        currentStageId: 'stg-2',
        applicationStatus: 'SCREENING',
        jobOpening: { stages },
        candidate: { email: 'alice@example.com', firstName: 'Alice' },
      });

      // Attempt backward movement: stg-2 (order 1) to stg-1 (order 0) with EMPLOYEE role (not recruiter/admin)
      await expect(
        applicationsService.moveStage(
          appId,
          orgId,
          'stg-1',
          undefined,
          { id: userId, roles: ['EMPLOYEE'] },
        ),
      ).rejects.toThrow(ForbiddenException);

      // Forward movement: stg-2 to stg-3
      mockPrisma.jobApplication.update.mockResolvedValue({
        id: appId,
        currentStageId: 'stg-3',
        currentStageName: 'Technical Interview',
      });
      mockPrisma.jobApplication.findUniqueOrThrow.mockResolvedValue({
        id: appId,
        currentStageId: 'stg-3',
        currentStageName: 'Technical Interview',
      });

      const updated = await applicationsService.moveStage(
        appId,
        orgId,
        'stg-3',
        'Advanced after screening call',
        { id: userId, roles: ['RECRUITER'] },
      );

      expect(updated.currentStageId).toBe('stg-3');
      expect(mockPrisma.applicationStageHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fromStageId: 'stg-2',
            toStageId: 'stg-3',
          }),
        }),
      );
    });

    it('should submit screening evaluation and update application score', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({
        id: appId,
        organizationId: orgId,
        applicationStatus: ApplicationStatus.APPLIED,
      });
      mockPrisma.jobApplication.update.mockResolvedValue({
        id: appId,
        screeningScore: 85,
        screeningNotes: 'Strong candidate with deep knowledge of PostgreSQL',
        applicationStatus: ApplicationStatus.SCREENING,
      });

      const res = await applicationsService.screen(
        appId,
        orgId,
        {
          screeningScore: 85,
          screeningNotes: 'Strong candidate with deep knowledge of PostgreSQL',
          passed: true,
        },
        userId,
      );

      expect(res.screeningScore).toBe(85);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.APPLICATION_SCREEN }),
      );
    });
  });

  describe('5. Interview Scheduling & Feedback', () => {
    it('should detect interviewer double-booking conflict and throw', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({
        id: appId,
        organizationId: orgId,
        candidateId,
        jobOpening: { title: 'Backend Lead' },
        candidate: { email: 'alice@example.com' },
      });

      // Existing overlapping interview for the same interviewer
      mockPrisma.interview.findFirst.mockResolvedValue({
        id: 'int-conflict',
        interviewerIds: ['emp-interviewer-1'],
        interviewDate: new Date('2026-11-20'),
        startTime: '10:00',
        endTime: '11:00',
      });

      await expect(
        interviewsService.schedule(
          orgId,
          {
            jobApplicationId: appId,
            interviewType: InterviewType.TECHNICAL_INTERVIEW,
            interviewDate: '2026-11-20',
            startTime: '10:30',
            endTime: '11:30',
            interviewerIds: ['emp-interviewer-1'],
          },
          userId,
        ),
      ).rejects.toThrow(/scheduling conflict/i);
    });

    it('should schedule interview when no conflict exists and send notification', async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue({
        id: appId,
        organizationId: orgId,
        candidateId,
        jobOpening: { title: 'Backend Lead' },
        candidate: { email: 'alice@example.com', firstName: 'Alice' },
      });
      mockPrisma.interview.findFirst.mockResolvedValue(null); // No conflict

      const mockInterview = {
        id: interviewId,
        organizationId: orgId,
        interviewType: InterviewType.TECHNICAL_INTERVIEW,
        interviewDate: new Date('2026-11-20'),
        startTime: '14:00',
        endTime: '15:00',
        status: InterviewStatus.SCHEDULED,
      };
      mockPrisma.interview.create.mockResolvedValue(mockInterview);

      const interview = await interviewsService.schedule(
        orgId,
        {
          jobApplicationId: appId,
          interviewType: InterviewType.TECHNICAL_INTERVIEW,
          interviewDate: '2026-11-20',
          startTime: '14:00',
          endTime: '15:00',
          interviewerIds: ['emp-interviewer-2'],
          meetingLink: 'https://meet.google.com/abc-xyz',
        },
        userId,
      );

      expect(interview.id).toBe(interviewId);
      expect(mockEmailService.sendNotification).toHaveBeenCalledWith(
        'alice@example.com',
        expect.stringContaining('Interview Scheduled'),
        expect.any(String),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.INTERVIEW_SCHEDULE }),
      );
    });

    it('should submit interview feedback with ratings and prevent duplicate feedback from same interviewer', async () => {
      mockPrisma.interview.findFirst.mockResolvedValue({
        id: interviewId,
        organizationId: orgId,
        candidateId,
        jobApplicationId: appId,
        interviewerIds: ['emp-interviewer-1'],
      });
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp-interviewer-1',
        userId,
      });

      // First submit: duplicate check returns existing
      mockPrisma.interviewFeedback.findFirst.mockResolvedValueOnce({ id: 'fb-existing' });

      await expect(
        interviewsService.submitFeedback(
          interviewId,
          orgId,
          {
            ratingTechnical: 5,
            ratingCommunication: 4,
            ratingCultureFit: 5,
            overallRating: 5,
            recommendation: InterviewRecommendation.STRONG_HIRE,
            strengths: ['Great architecture knowledge'],
          },
          userId,
          ['INTERVIEWER'],
        ),
      ).rejects.toThrow(/Feedback has already been submitted/);

      // Clean submit: no existing feedback
      mockPrisma.interviewFeedback.findFirst.mockResolvedValueOnce(null);
      mockPrisma.interviewFeedback.create.mockResolvedValue({
        id: 'fb-new',
        overallRating: 5,
        recommendation: InterviewRecommendation.STRONG_HIRE,
      });

      const fb = await interviewsService.submitFeedback(
        interviewId,
        orgId,
        {
          ratingTechnical: 5,
          ratingCommunication: 4,
          ratingCultureFit: 5,
          overallRating: 5,
          recommendation: InterviewRecommendation.STRONG_HIRE,
          strengths: ['Great architecture knowledge'],
        },
        userId,
        ['INTERVIEWER'],
      );

      expect(fb.recommendation).toBe(InterviewRecommendation.STRONG_HIRE);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.INTERVIEW_FEEDBACK_SUBMIT }),
      );
    });
  });

  describe('6. Offer Management & Approvals', () => {
    it('should validate salary parameters on offer creation', async () => {
      await expect(
        offersService.create(
          orgId,
          {
            candidateId,
            jobOpeningId: jobId,
            departmentId: 'dept-1',
            designationId: 'desig-1',
            locationId: 'loc-1',
            annualCtc: 0, // Invalid CTC
            offerDate: '2026-11-01',
            joiningDate: '2026-12-01',
            expiryDate: '2026-11-25',
          },
          userId,
        ),
      ).rejects.toThrow(/greater than zero/i);

      await expect(
        offersService.create(
          orgId,
          {
            candidateId,
            jobOpeningId: jobId,
            departmentId: 'dept-1',
            designationId: 'desig-1',
            locationId: 'loc-1',
            annualCtc: 1200000,
            offerDate: '2026-11-01',
            joiningDate: '2026-11-20',
            expiryDate: '2026-11-25', // Expiry after joining date
          },
          userId,
        ),
      ).rejects.toThrow(/on or before joining date/i);
    });

    it('should approve offer and record approval in audit', async () => {
      mockPrisma.offer.findFirst.mockResolvedValue({
        id: offerId,
        organizationId: orgId,
        offerStatus: OfferStatus.PENDING_APPROVAL,
        annualCtc: 3500000,
      });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp-approver' });
      mockPrisma.offer.update.mockResolvedValue({
        id: offerId,
        offerStatus: OfferStatus.APPROVED,
        approvedBy: 'emp-approver',
      });

      const res = await offersService.approve(offerId, orgId, userId);

      expect(res.offerStatus).toBe(OfferStatus.APPROVED);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.OFFER_APPROVE }),
      );
    });

    it('should record candidate offer acceptance and update candidate status', async () => {
      mockPrisma.offer.findFirst.mockResolvedValue({
        id: offerId,
        organizationId: orgId,
        candidateId,
        jobOpeningId: jobId,
        offerStatus: OfferStatus.SENT,
        expiryDate: new Date('2026-12-30'),
      });
      mockPrisma.offer.update.mockResolvedValue({
        id: offerId,
        offerStatus: OfferStatus.ACCEPTED,
        acceptedAt: new Date(),
      });

      const res = await offersService.accept(offerId, orgId, userId);

      expect(res.offerStatus).toBe(OfferStatus.ACCEPTED);
      expect(mockPrisma.candidate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: candidateId },
          data: { candidateStatus: CandidateStatus.OFFERED },
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.OFFER_ACCEPT }),
      );
    });

    it('should reject accepting an expired offer', async () => {
      mockPrisma.offer.findFirst.mockResolvedValue({
        id: offerId,
        organizationId: orgId,
        offerStatus: OfferStatus.SENT,
        expiryDate: new Date('2026-01-01'), // Expired date
      });

      await expect(offersService.accept(offerId, orgId, userId)).rejects.toThrow(
        /This offer has expired/,
      );
    });
  });

  describe('7. Candidate-to-Employee Conversion & Onboarding', () => {
    it('should require an accepted offer before converting candidate to employee', async () => {
      mockPrisma.candidate.findFirst.mockResolvedValue({
        id: candidateId,
        organizationId: orgId,
        email: 'alice@example.com',
      });
      mockPrisma.offer.findFirst.mockResolvedValue(null); // No accepted offer

      await expect(
        candidatesService.convertToEmployee(
          candidateId,
          orgId,
          {
            departmentId: 'dept-1',
            designationId: 'desig-1',
            locationId: 'loc-1',
            joiningDate: '2026-12-01',
          },
          userId,
        ),
      ).rejects.toThrow(/accepted offer before converting/i);
    });

    it('should convert candidate: link/create user, membership, employee, history, and trigger onboarding', async () => {
      const mockCandidate = {
        id: candidateId,
        organizationId: orgId,
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: '9876543210',
      };
      mockPrisma.candidate.findFirst.mockResolvedValue(mockCandidate);
      mockPrisma.offer.findFirst.mockResolvedValue({
        id: offerId,
        organizationId: orgId,
        candidateId,
        jobOpeningId: jobId,
        offerStatus: OfferStatus.ACCEPTED,
        jobApplicationId: appId,
      });

      // Not already converted check
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);

      // Target user lookup
      mockPrisma.user.findUnique.mockResolvedValue(null); // New user
      mockPrisma.user.create.mockResolvedValue({ id: 'usr-new-alice', email: 'alice@example.com' });

      // Membership
      mockPrisma.organizationMembership.findFirst.mockResolvedValue(null);
      mockPrisma.organizationMembership.create.mockResolvedValue({ id: 'mem-alice' });

      // Role
      mockPrisma.role.findFirst.mockResolvedValue({ id: 'role-emp', code: 'EMPLOYEE' });
      mockPrisma.userRole.findFirst.mockResolvedValue(null);
      mockPrisma.userRole.create.mockResolvedValue({ id: 'ur-1' });

      // Employee code count
      mockPrisma.employee.count.mockResolvedValue(5);
      const createdEmployee = {
        id: 'emp-alice',
        organizationId: orgId,
        employeeCode: 'EMP-0106',
        firstName: 'Alice',
        lastName: 'Smith',
        workEmail: 'alice.smith@zentra.com',
      };
      mockPrisma.employee.create.mockResolvedValue(createdEmployee);
      mockPrisma.employmentHistory.create.mockResolvedValue({ id: 'hist-1' });
      mockPrisma.candidate.update.mockResolvedValue({ ...mockCandidate, candidateStatus: 'HIRED' });
      mockPrisma.jobApplication.update.mockResolvedValue({ id: appId, applicationStatus: 'HIRED' });
      mockPrisma.jobOpening.update.mockResolvedValue({ id: jobId, filledOpenings: 1 });

      // Onboarding flow
      mockPrisma.onboardingFlow.findFirst.mockResolvedValue({ id: 'flow-std', isActive: true });
      mockPrisma.onboardingRun.create.mockResolvedValue({ id: 'run-1' });

      const emp = await candidatesService.convertToEmployee(
        candidateId,
        orgId,
        {
          departmentId: 'dept-1',
          designationId: 'desig-1',
          locationId: 'loc-1',
          joiningDate: '2026-12-01',
          workEmail: 'alice.smith@zentra.com',
          triggerOnboarding: true,
        },
        userId,
      );

      expect(emp.employeeCode).toBe('EMP-0106');
      expect(mockPrisma.employee.create).toHaveBeenCalled();
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'JOINED',
            remarks: 'Converted from accepted recruitment offer',
          }),
        }),
      );
      expect(mockPrisma.onboardingRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            onboardingFlowId: 'flow-std',
            employeeId: 'emp-alice',
          }),
        }),
      );
      expect(mockEmailService.sendNotification).toHaveBeenCalledWith(
        'alice.smith@zentra.com',
        expect.stringContaining('Welcome to Zentra'),
        expect.any(String),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CANDIDATE_CONVERT_EMPLOYEE }),
      );
    });
  });

  describe('8. Internal Postings & Employee Referrals', () => {
    it('should submit candidate referral and prevent duplicate referral', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp-referrer',
        userId,
        organizationId: orgId,
        firstName: 'Bob',
        lastName: 'Manager',
      });
      mockPrisma.jobOpening.findFirst.mockResolvedValue({
        id: jobId,
        title: 'DevOps Engineer',
        organizationId: orgId,
        stages: [{ id: 'stg-app', stageName: 'Applied' }],
      });

      // Existing referral check
      mockPrisma.employeeReferral.findFirst.mockResolvedValueOnce({ id: 'ref-dup' });

      await expect(
        referralsService.create(
          orgId,
          {
            candidateName: 'Charlie',
            candidateEmail: 'charlie@example.com',
            jobOpeningId: jobId,
          },
          userId,
        ),
      ).rejects.toThrow(/already referred this candidate/i);

      // Clean referral
      mockPrisma.employeeReferral.findFirst.mockResolvedValueOnce(null);
      mockPrisma.candidate.findFirst.mockResolvedValue(null);
      mockPrisma.candidate.create.mockResolvedValue({ id: 'cand-charlie' });
      mockPrisma.employeeReferral.create.mockResolvedValue({
        id: 'ref-1',
        candidateName: 'Charlie',
        candidateEmail: 'charlie@example.com',
      });

      const ref = await referralsService.create(
        orgId,
        {
          candidateName: 'Charlie',
          candidateEmail: 'charlie@example.com',
          jobOpeningId: jobId,
        },
        userId,
      );

      expect(ref.id).toBe('ref-1');
      expect(mockEmailService.sendNotification).toHaveBeenCalledWith(
        'charlie@example.com',
        expect.stringContaining('referred'),
        expect.any(String),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REFERRAL_CREATE }),
      );
    });

    it('should handle internal application for published job openings', async () => {
      mockPrisma.jobOpening.findFirst.mockResolvedValue({
        id: jobId,
        title: 'Product Manager',
        stages: [{ id: 'stg-app', stageName: 'Applied' }],
      });
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp-internal',
        firstName: 'David',
        lastName: 'Lee',
        workEmail: 'david@zentra.com',
        phone: '1234567890',
      });
      mockPrisma.candidate.findFirst.mockResolvedValue({ id: 'cand-david' });
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null); // No existing app
      mockPrisma.jobApplication.create.mockResolvedValue({
        id: 'app-david',
        sourceType: CandidateSourceType.INTERNAL_TRANSFER,
      });

      const res = await referralsService.applyInternalJob(jobId, orgId, userId);

      expect(res.id).toBe('app-david');
      expect(res.sourceType).toBe(CandidateSourceType.INTERNAL_TRANSFER);
    });
  });

  describe('9. Recruitment Analytics & Reports', () => {
    it('should calculate recruitment summary and export CSV report', async () => {
      mockPrisma.jobOpening.findMany.mockResolvedValue([
        { id: 'job-1', jobStatus: 'OPEN', numberOfOpenings: 5, filledOpenings: 2 },
        { id: 'job-2', jobStatus: 'DRAFT', numberOfOpenings: 3, filledOpenings: 0 },
      ]);

      const summary = await reportsService.getJobOpeningSummary(orgId);

      expect(summary.totalJobs).toBe(2);
      expect(summary.openJobs).toBe(1);
      expect(summary.totalOpenings).toBe(8);
      expect(summary.filledOpenings).toBe(2);
      expect(summary.pendingOpenings).toBe(6);

      // CSV Export test
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        {
          id: 'app-1',
          candidate: { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
          jobOpening: { title: 'Backend Lead', jobCode: 'BE-01', department: { name: 'Engineering' } },
          currentStageName: 'Interview',
          applicationStatus: 'INTERVIEW',
          sourceType: 'LINKEDIN',
          appliedAt: new Date('2026-11-01'),
          offer: { offerStatus: 'NONE' },
        },
      ]);

      const csvResult = await reportsService.exportReport(orgId, userId);

      expect(csvResult.rowCount).toBe(1);
      expect(csvResult.csv).toContain('Application ID,Candidate Name,Candidate Email');
      expect(csvResult.csv).toContain('Alice Smith');
      expect(csvResult.csv).toContain('Backend Lead');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.RECRUITMENT_REPORT_EXPORT }),
      );
    });
  });

  describe('10. Multi-Tenant Isolation & Audit Trail', () => {
    it('should strictly scope database queries to the active organizationId', async () => {
      mockPrisma.jobOpening.findMany.mockResolvedValue([]);

      await jobOpeningsService.findAll(orgId);

      expect(mockPrisma.jobOpening.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: orgId,
          }),
        }),
      );

      mockPrisma.candidate.findMany.mockResolvedValue([]);

      await candidatesService.findAll(orgId);

      expect(mockPrisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: orgId,
          }),
        }),
      );
    });
  });
});
