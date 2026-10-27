import { VerificationStatus } from "./website-analysis";

export type FlowStepType = "action" | "decision" | "verification" | "integration" | "terminal";

export interface DecisionBranch {
  id: string;
  condition: string;
  targetStepId: string | null; // step id or 'TERMINAL_SUCCESS' | 'TERMINAL_FAILURE'
  outcomeType: "success" | "failure" | "alternative";
  description?: string;
}

export interface FlowStep {
  id: string;
  stepNumber: number;
  title: string;
  type: FlowStepType;
  userAction: string;
  systemResponse: string;
  failurePoints?: string[];
  branches?: DecisionBranch[];
  nextStepId?: string | null;
  linkedRequirementCode?: string;
  linkedTestCaseId?: string;
}

export interface FlowValidationResult {
  hasStartNode: boolean;
  hasTerminalNode: boolean;
  unhandledFailureBranches: Array<{ stepId: string; stepTitle: string; reason: string }>;
  orphanedSteps: Array<{ stepId: string; stepTitle: string }>;
  healthScore: number; // 0 - 100
  warnings: string[];
  recommendations: string[];
}

export interface FlowTraceability {
  sourceEvidence: string;
  sourceUrl?: string;
  linkedRequirements: string[]; // e.g. ["REQ-FUNC-001", "REQ-BIZ-002"]
  linkedTestCases: string[]; // e.g. ["TC-E2E-001", "TC-E2E-002"]
  verifiedAt?: string;
}

export interface BusinessFlow {
  id: string; // UUID or temp ID
  projectId: string;
  flowCode: string; // e.g. "FLOW-001"
  title: string;
  description: string;
  category: "User Journey" | "Checkout & Payment" | "Authentication" | "System Integration" | "Operations";
  status: "draft" | "reviewed" | "approved" | "deprecated";
  verificationStatus: VerificationStatus;
  startPoint: string;
  endPoint: string;
  steps: FlowStep[];
  validation: FlowValidationResult;
  traceability: FlowTraceability;
  createdAt?: string;
  updatedAt?: string;
}
