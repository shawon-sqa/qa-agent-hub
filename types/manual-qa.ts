export type TestRunStatus = "in_progress" | "completed" | "aborted";
export type StepExecutionStatus = "passed" | "failed" | "blocked" | "not_run";
export type TestResultStatus = "passed" | "failed" | "blocked" | "not_run";

export interface TestStepExecution {
  stepNumber: number;
  action: string;
  expectedResult: string;
  actualResult?: string;
  status: StepExecutionStatus;
  notes?: string;
}

export interface EvidenceAttachment {
  id: string;
  type: "screenshot" | "log" | "link";
  title: string;
  urlOrContent: string;
  addedAt: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  suiteName: string;
  environment: string;
  testerName: string;
  status: TestRunStatus;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  notRunCount: number;
  startedAt: string;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestExecutionResult {
  id: string;
  runId: string;
  testCaseId?: string | null;
  testCaseCode: string;
  title: string;
  module?: string;
  priority?: "critical" | "high" | "medium" | "low";
  preconditions?: string[];
  status: TestResultStatus;
  stepsExecution: TestStepExecution[];
  notes?: string;
  evidenceUrls: EvidenceAttachment[];
  executionTimeMs: number;
  executedBy: string;
  executedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManualQaFilterState {
  searchQuery: string;
  suiteFilter: string;
  statusFilter: TestResultStatus | "all";
  priorityFilter: string;
}
