export type SecurityStatus = "pass" | "warn" | "fail" | "info";
export type SecuritySeverity = "Critical" | "High" | "Medium" | "Low" | "Safe";

export interface SecurityHeaderRemediation {
  nginx?: string;
  apache?: string;
  nextjs?: string;
  helmet?: string;
}

export interface SecurityHeaderCheck {
  id: string;
  header: string;
  status: SecurityStatus;
  severity: SecuritySeverity;
  value: string | null;
  description: string;
  riskExplanation: string;
  recommendation: string;
  remediationCode: SecurityHeaderRemediation;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  category: "Injection" | "Auth" | "XSS" | "Misconfiguration" | "Cryptographic" | "Information Disclosure";
  severity: "Critical" | "High" | "Medium" | "Low";
  cwe: string;
  description: string;
  remediation: string;
  verified: boolean;
}

export interface SecurityScanSummary {
  passed: number;
  warnings: number;
  failed: number;
  total: number;
  criticalRisks: number;
  highRisks: number;
}

export interface SecurityScanRun {
  id: string;
  project_id: string;
  target_url: string;
  overall_score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  scanned_by: string;
  scan_duration_ms: number;
  headers_checked: SecurityHeaderCheck[];
  vulnerabilities: SecurityVulnerability[];
  summary: SecurityScanSummary;
  status: "completed" | "in_progress" | "failed";
  created_at: string;
}
