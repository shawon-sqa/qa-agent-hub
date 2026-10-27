import { VerificationStatus } from "./website-analysis";

export type TestCaseType = "e2e" | "api" | "unit" | "security" | "performance" | "manual";
export type TestCasePriority = "critical" | "high" | "medium" | "low";
export type TestExecutionStatus = "Not Run" | "Running" | "Passed" | "Failed" | "Skipped";
export type TestCategoryVariation = "Positive" | "Negative" | "Edge Case";

export interface TestCaseExecutionStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  actualResult?: string;
  status?: "Passed" | "Failed" | "Not Run";
}

export interface FunctionalTestCase {
  id: string; // UUID from Supabase or generated
  projectId: string;
  scenarioId: string; // e.g. "SCEN-001"
  testCaseId: string; // e.g. "TC-E2E-001"
  requirementId?: string | null;
  requirementCode?: string;
  flowId?: string | null;
  flowCode?: string;
  title: string;
  module: string; // e.g. "Authentication", "Checkout", "Catalog", "API"
  categoryVariation: TestCategoryVariation;
  type: TestCaseType;
  priority: TestCasePriority;
  preconditions: string[];
  steps: TestCaseExecutionStep[];
  expectedResult: string;
  actualResult?: string;
  verificationStatus: VerificationStatus;
  executionStatus: TestExecutionStatus; // STRICT DEFAULT: "Not Run"
  approvalStatus: "draft" | "approved" | "rejected";
  executionDurationMs?: number;
  executionLogs?: string[];
  executedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestScenarioGroup {
  scenarioId: string;
  title: string;
  description: string;
  module: string;
  testCases: FunctionalTestCase[];
}
