import { LucideIcon } from "lucide-react";
import type { VerificationStatus, TenSectionAnalysis } from "./website-analysis";

export type { VerificationStatus, TenSectionAnalysis };

export type NavModuleId =
  | "dashboard"
  | "projects"
  | "website-analysis"
  | "requirements"
  | "system-requirements"
  | "business-flows"
  | "functional-qa"
  | "test-cases"
  | "test-suites"
  | "manual-qa"
  | "defect-management"
  | "bug-reports"
  | "api-testing"
  | "playwright-automation"
  | "security-testing"
  | "performance"
  | "performance-testing"
  | "qa-reports"
  | "ai-integrations"
  | "settings-audit";

export interface NavItem {
  id: NavModuleId;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: "blue" | "emerald" | "amber" | "rose" | "indigo";
  category:
    | "ANALYSIS & REQUIREMENTS"
    | "TEST MANAGEMENT"
    | "AUTOMATION & SECURITY"
    | "Core"
    | "Analysis & Specs"
    | "Insights & Config";
}

export interface QuickStat {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
  icon: LucideIcon;
  accentColor: string;
}

export interface QAProject {
  id: string;
  name: string;
  domain: string;
  environment: "Production" | "Staging" | "Dev";
  passRate: number;
  totalTests: number;
  lastRun: string;
  status: "Passed" | "Running" | "Failed" | "Warning";
  assignedAgent: string;
}

export interface AgentActivity {
  id: string;
  agentName: string;
  action: string;
  target: string;
  timestamp: string;
  status: "success" | "warning" | "in_progress" | "failed";
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  status: "online" | "busy" | "offline";
}
