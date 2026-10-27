import { VerificationStatus } from "./website-analysis";

export type RequirementCategory =
  | "Functional"
  | "Business Rules"
  | "User Requirements"
  | "Non-Functional"
  | "Security";

export type RequirementStatus =
  | "Draft"
  | "AI Generated"
  | "Reviewed"
  | "Approved"
  | "Rejected";

export type RequirementPriority = "Critical" | "High" | "Medium" | "Low";

export interface RequirementTraceability {
  sourceFeature: string;
  businessFlow: string;
  testCasesCount: number;
  defectsCount: number;
  sourceUrl?: string;
}

export interface SystemRequirement {
  id: string; // Supabase row UUID or client temporary ID
  projectId: string;
  reqCode: string; // e.g., "REQ-FUNC-001"
  title: string;
  description: string;
  category: RequirementCategory;
  status: RequirementStatus;
  priority: RequirementPriority;
  verificationStatus: VerificationStatus;
  acceptanceCriteria: string[];
  traceability: RequirementTraceability;
  createdAt?: string;
  updatedAt?: string;
}

export const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  "Functional",
  "Business Rules",
  "User Requirements",
  "Non-Functional",
  "Security",
];

export const REQUIREMENT_STATUSES: RequirementStatus[] = [
  "Draft",
  "AI Generated",
  "Reviewed",
  "Approved",
  "Rejected",
];
