export type BugSeverity = "critical" | "high" | "medium" | "low";
export type BugPriority = "critical" | "high" | "medium" | "low";
export type BugLifecycleStatus = "open" | "in_progress" | "resolved" | "closed";

export interface BugReproductionStep {
  stepNumber: number;
  description: string;
}

export interface BugEvidence {
  id: string;
  type: "screenshot" | "log" | "trace" | "url";
  title: string;
  content: string;
  uploadedAt: string;
}

export interface BugReport {
  id: string;
  projectId: string;
  testCaseId?: string | null;
  testCaseCode?: string;
  runId?: string | null;
  testResultId?: string | null;
  title: string;
  description: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugLifecycleStatus;
  reproductionSteps: BugReproductionStep[];
  expectedResult?: string;
  actualResult?: string;
  environment?: string;
  reportedBy: string;
  assignee: string;
  evidenceUrls: BugEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface BugFilterState {
  searchQuery: string;
  statusFilter: BugLifecycleStatus | "all";
  severityFilter: BugSeverity | "all";
  priorityFilter: BugPriority | "all";
}
