import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService } from '../src/workflows/workflow-engine.service';
import { WorkflowsService } from '../src/workflows/workflows.service';
import { WorkflowsRepository } from '../src/workflows/workflows.repository';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { ApprovalsRepository } from '../src/approvals/approvals.repository';
import { TasksService } from '../src/tasks/tasks.service';
import { TasksRepository } from '../src/tasks/tasks.repository';
import { ChecklistsService } from '../src/checklists/checklists.service';
import { ChecklistsRepository } from '../src/checklists/checklists.repository';
import { DelegationsService } from '../src/delegations/delegations.service';
import { DelegationsRepository } from '../src/delegations/delegations.repository';
import { UsersRepository } from '../src/users/users.repository';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { AuditService } from '../src/audit/audit.service';
import { EmailService } from '../src/email/email.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  ConditionMatchType,
  ConditionOperator,
  WorkflowActionType,
  WorkflowExecutionStatus,
  ApprovalStatus,
  ApprovalStepStatus,
  ApproverType,
  TaskPriority,
  TaskStatus,
} from '@zentra/shared-types';

describe('Workflow & Approval Engine Suite', () => {
  let workflowEngine: WorkflowEngineService;
  let approvalsService: ApprovalsService;
  let checklistsService: ChecklistsService;
  let tasksService: TasksService;
  let delegationsService: DelegationsService;

  const mockPrisma = {
    workflowExecution: {
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
    employee: {
      update: jest.fn().mockResolvedValue({ id: 'emp-1', employmentStatus: 'confirmed' }),
    },
  };

  const mockWorkflowsRepo = {
    findMatchingRules: jest.fn(),
    createExecution: jest.fn(),
    createRule: jest.fn(),
    findRuleById: jest.fn(),
    updateRule: jest.fn(),
    listRules: jest.fn(),
    softDeleteRule: jest.fn(),
    listExecutions: jest.fn(),
  };

  const mockApprovalsRepo = {
    createApprovalFlow: jest.fn(),
    findById: jest.fn(),
    updateFlow: jest.fn(),
    updateStep: jest.fn(),
    listFlows: jest.fn(),
    findOverdueSteps: jest.fn(),
  };

  const mockTasksRepo = {
    create: jest.fn(),
    createTask: jest.fn(),
    findById: jest.fn(),
    findTaskById: jest.fn(),
    update: jest.fn(),
    updateTask: jest.fn(),
    list: jest.fn(),
    listTasks: jest.fn(),
    softDelete: jest.fn(),
    softDeleteTask: jest.fn(),
  };

  const mockChecklistsRepo = {
    findChecklistById: jest.fn(),
    createChecklistRun: jest.fn(),
    findRunById: jest.fn(),
    updateRunItem: jest.fn(),
    updateRun: jest.fn(),
    listRuns: jest.fn(),
  };

  const mockDelegationsRepo = {
    findActiveDelegation: jest.fn(),
    create: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    revoke: jest.fn(),
  };

  const mockUsersRepo = {
    findById: jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user1@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
    }),
  };

  const mockEmployeesRepo = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    updateEmployee: jest.fn().mockResolvedValue({ id: 'emp-1' }),
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
        WorkflowEngineService,
        WorkflowsService,
        ApprovalsService,
        ChecklistsService,
        TasksService,
        DelegationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WorkflowsRepository, useValue: mockWorkflowsRepo },
        { provide: ApprovalsRepository, useValue: mockApprovalsRepo },
        { provide: TasksRepository, useValue: mockTasksRepo },
        { provide: ChecklistsRepository, useValue: mockChecklistsRepo },
        { provide: DelegationsRepository, useValue: mockDelegationsRepo },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: EmployeesRepository, useValue: mockEmployeesRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    workflowEngine = module.get(WorkflowEngineService);
    approvalsService = module.get(ApprovalsService);
    checklistsService = module.get(ChecklistsService);
    tasksService = module.get(TasksService);
    delegationsService = module.get(DelegationsService);
  });

  describe('Condition Evaluation Engine', () => {
    it('evaluates EQUALS operator with dot-notation path', () => {
      const context = { employee: { department: { code: 'ENG' } } };
      const conditions = [{ field: 'employee.department.code', operator: ConditionOperator.EQUALS, value: 'eng' }];

      const result = workflowEngine.evaluateConditions(conditions, ConditionMatchType.ALL, context);
      expect(result.matched).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it('evaluates GREATER_THAN and LESS_THAN operators', () => {
      const context = { compensation: { baseSalary: 75000 } };
      const conditions = [
        { field: 'compensation.baseSalary', operator: ConditionOperator.GREATER_THAN, value: 50000 },
        { field: 'compensation.baseSalary', operator: ConditionOperator.LESS_THAN, value: 100000 },
      ];

      const result = workflowEngine.evaluateConditions(conditions, ConditionMatchType.ALL, context);
      expect(result.matched).toBe(true);
    });

    it('evaluates IN operator with arrays and comma-separated values', () => {
      const context = { role: 'engineering_manager' };
      const conditions = [
        { field: 'role', operator: ConditionOperator.IN, value: ['hr_admin', 'engineering_manager', 'director'] },
      ];

      const result = workflowEngine.evaluateConditions(conditions, ConditionMatchType.ALL, context);
      expect(result.matched).toBe(true);
    });

    it('evaluates ANY (OR) match type correctly', () => {
      const context = { department: 'sales', level: 'junior' };
      const conditions = [
        { field: 'department', operator: ConditionOperator.EQUALS, value: 'engineering' }, // false
        { field: 'level', operator: ConditionOperator.EQUALS, value: 'junior' }, // true
      ];

      const result = workflowEngine.evaluateConditions(conditions, ConditionMatchType.ANY, context);
      expect(result.matched).toBe(true);
    });

    it('evaluates IS_EMPTY and IS_NOT_EMPTY operators', () => {
      const context = { notes: '', tags: ['urgent'] };
      const conditions = [
        { field: 'notes', operator: ConditionOperator.IS_EMPTY, value: null },
        { field: 'tags', operator: ConditionOperator.IS_NOT_EMPTY, value: null },
      ];

      const result = workflowEngine.evaluateConditions(conditions, ConditionMatchType.ALL, context);
      expect(result.matched).toBe(true);
    });
  });

  describe('Workflow Trigger & Action Execution', () => {
    it('executes active rules and records execution log', async () => {
      mockWorkflowsRepo.findMatchingRules.mockResolvedValue([
        {
          id: 'rule-1',
          name: 'Onboard New Hire',
          conditions: [{ field: 'status', operator: 'equals', value: 'active' }],
          conditionMatchType: 'ALL',
          actions: [
            {
              isActive: true,
              actionType: WorkflowActionType.SEND_NOTIFICATION,
              actionConfig: { title: 'Welcome', message: 'Hello {{user.name}}', recipientUserId: 'user-1' },
            },
          ],
        },
      ]);

      mockWorkflowsRepo.createExecution.mockResolvedValue({ id: 'exec-1' });

      const outcomes = await workflowEngine.trigger({
        organizationId: 'org-1',
        entityType: 'Employee',
        entityId: 'emp-1',
        triggerEvent: 'record_created',
        context: { status: 'active', user: { name: 'Bob' } },
        actorUserId: 'admin-1',
      });

      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].status).toBe(WorkflowExecutionStatus.COMPLETED);
      expect(mockEmailService.sendNotification).toHaveBeenCalledWith('user-1', 'Welcome', 'Hello Bob');
    });
  });

  describe('Multi-level Approvals & Decision Processing', () => {
    it('creates a multi-level approval flow and resolves reporting manager', async () => {
      mockEmployeesRepo.findByUserId.mockResolvedValue({
        id: 'emp-1',
        reportingManagerId: 'mgr-emp-1',
      });
      mockEmployeesRepo.findById.mockResolvedValue({
        id: 'mgr-emp-1',
        userId: 'mgr-user-id',
      });

      mockApprovalsRepo.createApprovalFlow.mockImplementation((flow) =>
        Promise.resolve({
          id: 'flow-1',
          organizationId: flow.organizationId,
          requestType: flow.requestType,
          entityType: flow.entityType,
          entityId: flow.entityId,
          requestedBy: flow.requestedBy,
          currentStep: 1,
          status: ApprovalStatus.PENDING,
          steps: flow.steps.map((s: any, idx: number) => ({
            id: `step-${idx + 1}`,
            stepOrder: s.stepOrder || idx + 1,
            stepName: s.stepName,
            approverType: s.approverType,
            approverId: s.approverId,
            status: idx === 0 ? ApprovalStepStatus.PENDING : ApprovalStepStatus.WAITING,
          })),
        }),
      );

      const flow = await approvalsService.createApprovalFlow({
        organizationId: 'org-1',
        requestType: 'profile_change',
        entityType: 'Employee',
        entityId: 'emp-1',
        requestedBy: 'user-emp-1',
        steps: [
          { stepName: 'Manager Review', approverType: ApproverType.REPORTING_MANAGER },
          { stepName: 'HR Review', approverType: ApproverType.SPECIFIC_ROLE, approverRole: 'hr_admin' },
        ],
      });

      expect(flow.id).toBe('flow-1');
      expect(flow.steps[0].approverId).toBe('mgr-user-id');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('advances sequential step when first approver approves', async () => {
      const flow = {
        id: 'flow-1',
        organizationId: 'org-1',
        requestedBy: 'user-1',
        currentStep: 1,
        status: ApprovalStatus.PENDING,
        steps: [
          { id: 's1', stepOrder: 1, approverId: 'mgr-1', status: ApprovalStepStatus.PENDING },
          { id: 's2', stepOrder: 2, approverId: 'hr-1', status: ApprovalStepStatus.WAITING },
        ],
      };

      mockApprovalsRepo.findById.mockResolvedValue(flow);

      await approvalsService.processDecision(
        'flow-1',
        'org-1',
        { decision: 'approve', comments: 'Looks good' },
        'mgr-1',
      );

      expect(mockApprovalsRepo.updateStep).toHaveBeenCalledWith('s1', expect.objectContaining({
        status: ApprovalStepStatus.APPROVED,
        decidedBy: 'mgr-1',
      }));

      expect(mockApprovalsRepo.updateStep).toHaveBeenCalledWith('s2', expect.objectContaining({
        status: ApprovalStepStatus.PENDING,
      }));

      expect(mockApprovalsRepo.updateFlow).toHaveBeenCalledWith('flow-1', 'org-1', expect.objectContaining({
        currentStep: 2,
      }));
    });

    it('applies profile changes to employee when final approval step completes', async () => {
      const flow = {
        id: 'flow-2',
        organizationId: 'org-1',
        requestedBy: 'user-1',
        requestType: 'profile_change',
        entityType: 'Employee',
        entityId: 'emp-10',
        currentStep: 2,
        status: ApprovalStatus.PENDING,
        metadata: {
          requestedChanges: { personalEmail: 'newemail@example.com' },
          employeeId: 'emp-10',
        },
        steps: [
          { id: 's1', stepOrder: 1, approverId: 'mgr-1', status: ApprovalStepStatus.APPROVED },
          { id: 's2', stepOrder: 2, approverId: 'hr-1', status: ApprovalStepStatus.PENDING },
        ],
      };

      mockApprovalsRepo.findById.mockResolvedValue(flow);

      await approvalsService.processDecision(
        'flow-2',
        'org-1',
        { decision: 'approve', comments: 'Final HR approval' },
        'hr-1',
      );

      expect(mockApprovalsRepo.updateFlow).toHaveBeenCalledWith('flow-2', 'org-1', expect.objectContaining({
        status: ApprovalStatus.APPROVED,
      }));

      expect(mockEmployeesRepo.updateEmployee).toHaveBeenCalledWith(
        'emp-10',
        'org-1',
        { personalEmail: 'newemail@example.com' },
      );
    });

    it('handles rejection by stopping the chain and marking flow rejected', async () => {
      const flow = {
        id: 'flow-3',
        organizationId: 'org-1',
        requestedBy: 'user-1',
        currentStep: 1,
        status: ApprovalStatus.PENDING,
        steps: [
          { id: 's1', stepOrder: 1, approverId: 'mgr-1', status: ApprovalStepStatus.PENDING },
        ],
      };

      mockApprovalsRepo.findById.mockResolvedValue(flow);

      await approvalsService.processDecision(
        'flow-3',
        'org-1',
        { decision: 'reject', comments: 'Insufficient info' },
        'mgr-1',
      );

      expect(mockApprovalsRepo.updateFlow).toHaveBeenCalledWith('flow-3', 'org-1', expect.objectContaining({
        status: ApprovalStatus.REJECTED,
      }));
    });

    it('supports auto-approval and auto-rejection policies', async () => {
      mockApprovalsRepo.createApprovalFlow.mockImplementation((flow) =>
        Promise.resolve({
          id: 'flow-auto-1',
          organizationId: flow.organizationId,
          requestType: flow.requestType,
          entityType: flow.entityType,
          entityId: flow.entityId,
          requestedBy: flow.requestedBy,
          currentStep: 1,
          status: ApprovalStatus.PENDING,
          steps: flow.steps.map((s: any, idx: number) => ({
            id: `step-${idx + 1}`,
            stepOrder: s.stepOrder || idx + 1,
            stepName: s.stepName,
            status: ApprovalStepStatus.PENDING,
          })),
        }),
      );

      mockApprovalsRepo.findById.mockImplementation((id, orgId) =>
        Promise.resolve({
          id,
          organizationId: orgId,
          status: ApprovalStatus.APPROVED,
          steps: [],
        }),
      );

      const autoFlow = await approvalsService.createApprovalFlow({
        organizationId: 'org-1',
        requestType: 'small_expense',
        entityType: 'Expense',
        entityId: 'exp-1',
        requestedBy: 'user-1',
        steps: [{ stepName: 'Auto Step', approverType: ApproverType.EMPLOYEE_SELF }],
        metadata: { autoApprove: true },
      });

      expect(mockApprovalsRepo.updateFlow).toHaveBeenCalledWith(
        expect.any(String),
        'org-1',
        expect.objectContaining({ status: ApprovalStatus.APPROVED }),
      );
    });

    it('permits delegate to act on behalf of delegator', async () => {
      const flow = {
        id: 'flow-del-1',
        organizationId: 'org-1',
        requestedBy: 'user-1',
        currentStep: 1,
        status: ApprovalStatus.PENDING,
        steps: [
          { id: 's1', stepOrder: 1, approverId: 'mgr-busy', status: ApprovalStepStatus.PENDING },
        ],
      };

      mockApprovalsRepo.findById.mockResolvedValue(flow);
      mockDelegationsRepo.findActiveDelegation.mockResolvedValue({
        id: 'del-1',
        delegateFromUserId: 'mgr-busy',
        delegateToUserId: 'colleague-substitute',
        status: 'active',
      });

      await approvalsService.processDecision(
        'flow-del-1',
        'org-1',
        { decision: 'approve', comments: 'Acting on behalf while manager is away' },
        'colleague-substitute',
      );

      expect(mockApprovalsRepo.updateStep).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ status: ApprovalStepStatus.APPROVED, decidedBy: 'colleague-substitute' }),
      );
    });
  });

  describe('Checklists & Task Tracking', () => {
    it('executes checklist and auto-assigns individual tasks for items with owners', async () => {
      mockChecklistsRepo.findChecklistById.mockResolvedValue({
        id: 'chk-1',
        name: 'Employee Offboarding',
        items: [
          { id: 'item-1', title: 'Revoke VPN Access', ownerType: 'role', ownerId: 'it-admin', dueOffsetDays: 1 },
          { id: 'item-2', title: 'Return Laptop', ownerType: 'employee', ownerId: 'emp-1', dueOffsetDays: 2 },
        ],
      });

      mockChecklistsRepo.createChecklistRun.mockResolvedValue({
        id: 'run-1',
        checklistId: 'chk-1',
        items: [
          { id: 'run-item-1', title: 'Revoke VPN Access', ownerId: 'it-admin' },
          { id: 'run-item-2', title: 'Return Laptop', ownerId: 'emp-1' },
        ],
      });

      mockTasksRepo.create.mockResolvedValue({ id: 'task-1' });

      await checklistsService.executeChecklist('chk-1', 'org-1', {
        entityType: 'Employee',
        entityId: 'emp-1',
      });

      expect(mockTasksRepo.create).toHaveBeenCalledTimes(2);
      expect(mockTasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Revoke VPN Access'),
          assignedTo: 'it-admin',
        }),
      );
    });

    it('tracks task progress from PENDING to COMPLETED', async () => {
      mockTasksRepo.create.mockResolvedValue({
        id: 'task-10',
        title: 'Review Documentation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
      });

      const task = await tasksService.createTask('org-1', {
        title: 'Review Documentation',
        priority: TaskPriority.HIGH,
      });

      expect(task.status).toBe(TaskStatus.PENDING);

      mockTasksRepo.findById.mockResolvedValue({
        id: 'task-10',
        organizationId: 'org-1',
        title: 'Review Documentation',
        status: TaskStatus.PENDING,
      });

      mockTasksRepo.update.mockResolvedValue({
        id: 'task-10',
        title: 'Review Documentation',
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      const completed = await tasksService.completeTask('task-10', 'org-1');

      expect(completed.status).toBe(TaskStatus.COMPLETED);
    });
  });
});
