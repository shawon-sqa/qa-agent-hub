export type QaPromptDomainId =
  | "exploratory"
  | "playwright_e2e"
  | "api_testing"
  | "security_owasp"
  | "performance_k6"
  | "accessibility_wcag"
  | "boundary_edge"
  | "database_integrity"
  | "mobile_responsive"
  | "negative_chaos"
  | "compliance_audit"
  | "regression_architecture";

export interface QaPromptDomain {
  id: QaPromptDomainId;
  title: string;
  category: "Automation" | "Security & Perf" | "Specialized QA" | "Strategy & Audit";
  description: string;
  iconName: string;
  recommendedModel: string;
}

export interface PromptContextData {
  targetUrl?: string;
  domain?: string;
  businessType?: string;
  projectName?: string;
  environment?: string;
  features?: string[];
  workflowStages?: string[];
  requirements?: Array<{ reqCode: string; title: string; category?: string }>;
  testCasesCount?: number;
  openDefectsCount?: number;
  verificationStatusSummary?: {
    verified: number;
    potentialIssue: number;
    unverified: number;
    aiGenerated: number;
  };
}

export const QA_PROMPT_DOMAINS: QaPromptDomain[] = [
  {
    id: "exploratory",
    title: "Exploratory Testing Charters",
    category: "Specialized QA",
    description: "Time-boxed session charters and tour heuristics for unscripted QA discovery.",
    iconName: "Compass",
    recommendedModel: "Gemini 1.5 Pro / Claude 3.5 Sonnet",
  },
  {
    id: "playwright_e2e",
    title: "E2E Playwright Automation",
    category: "Automation",
    description: "Production-ready TypeScript Playwright specs with Page Object Models and assertions.",
    iconName: "PlayCircle",
    recommendedModel: "Claude 3.5 Sonnet / GPT-4o",
  },
  {
    id: "api_testing",
    title: "API Testing & Postman Collections",
    category: "Automation",
    description: "REST / GraphQL test suites, schema validation, and Newman collections.",
    iconName: "Network",
    recommendedModel: "Gemini 1.5 Pro",
  },
  {
    id: "security_owasp",
    title: "Security & OWASP Top 10 Audit",
    category: "Security & Perf",
    description: "Penetration test vectors, XSS/CSRF boundaries, auth bypass, and SSRF checks.",
    iconName: "ShieldAlert",
    recommendedModel: "GPT-4o / Claude 3.5 Sonnet",
  },
  {
    id: "performance_k6",
    title: "Performance & Load Testing (k6 / JMeter)",
    category: "Security & Perf",
    description: "k6 load scripts, stress ramps, spike tests, and p95/p99 latency thresholds.",
    iconName: "Zap",
    recommendedModel: "Gemini 1.5 Pro",
  },
  {
    id: "accessibility_wcag",
    title: "Accessibility & WCAG 2.1 AA Audit",
    category: "Specialized QA",
    description: "Screen reader tree, keyboard navigation, color contrast, and ARIA audits.",
    iconName: "Eye",
    recommendedModel: "Claude 3.5 Sonnet",
  },
  {
    id: "boundary_edge",
    title: "Boundary Value & Edge Case Analysis",
    category: "Specialized QA",
    description: "Equivalence partitioning, max integer limits, unicode attacks, and race conditions.",
    iconName: "Sliders",
    recommendedModel: "GPT-4o",
  },
  {
    id: "database_integrity",
    title: "Database & Data Integrity QA",
    category: "Strategy & Audit",
    description: "ACID validation, foreign key cascades, transaction rollbacks, and schema migrations.",
    iconName: "Database",
    recommendedModel: "Gemini 1.5 Pro",
  },
  {
    id: "mobile_responsive",
    title: "Mobile & Responsive Layout Audit",
    category: "Specialized QA",
    description: "Touch targets (48x48px), viewport breakpoint glitches, and iOS Safari quirks.",
    iconName: "Smartphone",
    recommendedModel: "Claude 3.5 Sonnet",
  },
  {
    id: "negative_chaos",
    title: "Negative & Chaos Testing",
    category: "Specialized QA",
    description: "Simulating network latency, 502 Bad Gateway responses, and malformed JWT payloads.",
    iconName: "Flame",
    recommendedModel: "GPT-4o",
  },
  {
    id: "compliance_audit",
    title: "Compliance & Audit Documentation (SOC2 / HIPAA)",
    category: "Strategy & Audit",
    description: "Regulatory test evidence, audit logging verification, and PII masking checks.",
    iconName: "FileCheck",
    recommendedModel: "Claude 3.5 Sonnet",
  },
  {
    id: "regression_architecture",
    title: "Regression Test Suite Architecture",
    category: "Strategy & Audit",
    description: "Smoke vs Sanity vs Full regression tagging, CI/CD pipeline matrix, and risk weighting.",
    iconName: "Layers",
    recommendedModel: "Claude 3.5 Sonnet / Gemini 1.5 Pro",
  },
];
