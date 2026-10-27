export interface PageInventoryItem {
  id: string;
  url: string;
  path: string;
  title: string;
  statusCode: number;
  statusText: string;
  loadTimeMs: number;
  sizeKb: number;
  linksFound: number;
  lastChecked: string;
  requiresAuth?: boolean;
}

export interface DiagnosticSignals {
  brokenLinksCount: number;
  consoleErrorsCount: number;
  missingMetadataCount: number;
  accessibilityWarningsCount: number;
  securityHeadersScore: number;
  mobileResponsive: boolean;
  sslValid: boolean;
}

export type FindingCategory =
  | "Security"
  | "Performance"
  | "Accessibility"
  | "SEO"
  | "Reliability"
  | "Functional"
  | "Workflow"
  | "Business"
  | "UI"
  | "API";

export type VerificationStatus =
  | "Verified"
  | "Unverified"
  | "Potential Issue"
  | "Not Tested"
  | "AI Generated"
  | "Not Applicable";

export type EvidenceStatus =
  | VerificationStatus
  | "Observed"
  | "Confirmed issue"
  | "Potential risk"
  | "Not tested";

export interface EvidenceFinding {
  id: string;
  category: FindingCategory;
  severity: "critical" | "warning" | "info";
  evidenceStatus: EvidenceStatus;
  verificationStatus?: VerificationStatus;
  title: string;
  description: string;
  evidence: string;
  remediation: string;
  confidenceScore: number; // 0-100
  timestamp: string;
  rootCauseKey?: string;
  endpointOrPage?: string;
  affectedEndpoints?: string[];
  occurrenceCount?: number;
  scenario?: string;
  expectedResult?: string;
  actualResult?: string;
  priority?: "critical" | "high" | "medium" | "low";
}

export interface BusinessIntelligence {
  businessType: string;
  industry: string;
  summary: string;
  competitorExamples: string[];
  targetAudience: string;
  monetizationModel: string;
  authStrategyDetected: string;
}

// ==========================================
// 10-SECTION EXHAUSTIVE BUSINESS & PRODUCT ANALYSIS FRAMEWORK
// ==========================================

export interface CrawlingDataCollectionSection {
  accessiblePages: string[];
  navigationStructure: string;
  informationArchitecture: string;
  missingInfoNote: string;
  discoveredPages?: string[];
  testedPages?: PageInventoryItem[];
}

export interface BusinessOverviewSection {
  problemSolved: string;
  productsAndServices: string;
  valueProposition: string;
  revenueModel: string; // Real verified model or "Not publicly available"
}

export interface TargetAudiencePersona {
  name: string;
  role: string;
  userType: "Primary" | "Secondary";
  goals: string[];
  painPoints: string[];
}

export interface TargetAudienceSection {
  personas: TargetAudiencePersona[];
  primaryUserSummary: string;
  secondaryUserSummary: string;
  coreCustomerNeeds: string[];
}

export interface FeatureWorkflowItem {
  featureName: string;
  businessPurpose: string;
  customerBenefit: string;
  userAction?: string;
  observedBehavior?: string;
  testStatus?: "Not Run" | string;
  verificationStatus?: VerificationStatus;
}

export interface WorkflowStep {
  stepNumber: number;
  stageName: string;
  userAction: string;
  systemResponse: string;
  startingPoint?: string;
  failurePoints?: string[];
}

export interface FeatureWorkflowSection {
  majorFeatures: FeatureWorkflowItem[];
  workflowJourney: {
    primaryJourney: string;
    startingPoint?: string;
    failurePoints?: string[];
    steps: WorkflowStep[];
  };
}

export interface CompetitorItem {
  name: string;
  type: "Direct" | "Indirect";
  differences: string;
  competitiveAdvantage: string;
  missingCapabilities?: string[];
}

export interface CompetitorAnalysisSection {
  directCompetitors: CompetitorItem[];
  indirectCompetitors: CompetitorItem[];
  marketDifferentiators: string[];
  marketPositioning: string;
}

export interface MarketOpportunityItem {
  gap: string;
  severity: "High" | "Medium" | "Low";
  businessImpact: string;
}

export interface MissingFeaturesGapsSection {
  unaddressedNeeds: string[];
  workflowLimits: string[];
  marketOpportunities: MarketOpportunityItem[];
}

export interface OpportunityItem {
  opportunityName: string;
  type: "Automation" | "Growth" | "Revenue";
  description: string;
  priority: "High" | "Medium" | "Low";
  estimatedEffort: "Low" | "Medium" | "High";
  potentialUpside: string;
  confidenceLevel?: "High" | "Medium" | "Low" | string;
}

export interface BusinessOpportunitiesSection {
  automationOpportunities: OpportunityItem[];
  growthOpportunities: OpportunityItem[];
  revenueOpportunities: OpportunityItem[];
}

export interface UiUxExperienceSection {
  usabilityScore: number; // 0-100
  scoringMethodology?: string;
  navigationEvaluation: string;
  organizationClarity: string;
  frictionPoints: string[];
  usabilityImprovements: string[];
  mobileResponsiveNote: string;
}

export interface BusinessRiskItem {
  risk: string;
  category: "Operational" | "Scalability" | "Workflow";
  severity: "High" | "Medium" | "Low";
  impact: string;
  mitigationStrategy: string;
}

export interface BusinessRisksSection {
  operationalRisks: BusinessRiskItem[];
  scalabilityRisks: BusinessRiskItem[];
  workflowRisks: BusinessRiskItem[];
}

export interface FinalRecommendationItem {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  findingEvidence: string;
  businessImpact: string;
  category: "Product" | "UX" | "QA & Automation" | "Revenue" | "Operations";
  timeframe: string;
  team?: string;
  successMetrics?: string;
  verificationMethod?: string;
}

export interface FinalReportSection {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: FinalRecommendationItem[];
}

export interface TenSectionAnalysis {
  section1_crawlingAndDataCollection: CrawlingDataCollectionSection;
  section2_businessOverview: BusinessOverviewSection;
  section3_targetAudience: TargetAudienceSection;
  section4_featuresAndWorkflows: FeatureWorkflowSection;
  section5_competitorAnalysis: CompetitorAnalysisSection;
  section6_missingFeaturesAndGaps: MissingFeaturesGapsSection;
  section7_businessOpportunities: BusinessOpportunitiesSection;
  section8_uiUxAndExperience: UiUxExperienceSection;
  section9_businessRisksAndLimitations: BusinessRisksSection;
  section10_finalReportAndRecommendations: FinalReportSection;
}

export type AnalysisModuleType =
  | "business"
  | "workflow"
  | "functional"
  | "ui"
  | "api"
  | "security"
  | "accessibility"
  | "performance";

export type AnalysisScope = "full" | "shallow" | "targeted";
export type ViewportType = "desktop" | "mobile" | "both";

export interface CrawlCoverageMetrics {
  discovered: number;
  inspected: number;
  skipped: number;
  maxDepth: number;
  allowlist: string[];
  skippedUrls?: Array<{ url: string; reason: string }>;
}

export interface GeneratedTestCase {
  id: string;
  module: AnalysisModuleType;
  feature: string;
  scenario: string;
  preconditions: string[];
  steps: string[];
  expectedResults: string;
  priority: "critical" | "high" | "medium" | "low";
  evidenceSource: string;
  status: "Not Run";
}

export interface AnalysisCoverage {
  crawl: CrawlCoverageMetrics;
  pagesScanned: number;
  modulesCovered: AnalysisModuleType[];
  findingsCount: {
    total: number;
    observed: number;
    confirmedIssues: number;
    potentialRisks: number;
    notTested: number;
  };
  testCasesGeneratedCount: number;
}

export interface AiBusinessOverview {
  businessCategory: string;
  industry: string;
  purpose: string;
  coreValue: string;
  problemSolved: string;
  monetizationModel: string;
}

export interface AiTargetAudience {
  primaryUsers: string;
  painPoints: string[];
  userRoles: string[];
  customerNeeds: string[];
}

export interface AiCoreFeature {
  name: string;
  businessPurpose: string;
  customerBenefit: string;
  verificationStatus?: VerificationStatus;
}

export interface AiBusinessWorkflowStep {
  stepNumber: number;
  stageName: string;
  userAction: string;
  systemResponse: string;
}

export interface AiBusinessWorkflows {
  primaryJourney: string;
  steps: AiBusinessWorkflowStep[];
}

export interface AiAuthRequiredNotice {
  isPrivateApp: boolean;
  requiresAuth: boolean;
  authTypeDetected: string;
  notice: string;
}

export interface AiCompetitorInsight {
  competitor: string;
  type: "Direct" | "Indirect";
  difference: string;
  advantage: string;
}

export interface AiRecommendation {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  impact: string;
  category: string;
  timeframe: string;
}

export interface TenStepFramework {
  step1_crawlingAndPageInventory: CrawlingDataCollectionSection;
  step2_businessClassification: BusinessOverviewSection;
  step3_featureIdentification: {
    features: FeatureWorkflowItem[];
  };
  step4_businessWorkflow: {
    primaryJourney: string;
    startingPoint: string;
    failurePoints: string[];
    steps: WorkflowStep[];
  };
  step5_functionalQaAudit: {
    findings: EvidenceFinding[];
  };
  step6_uiUxAudit: UiUxExperienceSection;
  step7_competitorAnalysis: CompetitorAnalysisSection;
  step8_missingFeaturesAndOpportunities: {
    unaddressedNeeds: string[];
    workflowLimits: string[];
    marketOpportunities: MarketOpportunityItem[];
    automationOpportunities: OpportunityItem[];
    growthOpportunities: OpportunityItem[];
    revenueOpportunities: OpportunityItem[];
  };
  step9_securityAndPerformance: {
    signals: DiagnosticSignals;
    operationalRisks: BusinessRiskItem[];
    scalabilityRisks: BusinessRiskItem[];
    workflowRisks: BusinessRiskItem[];
  };
  step10_prioritizedActionPlan: FinalReportSection & {
    actionPlan: FinalRecommendationItem[];
  };
}

export interface WebsiteAnalysisReport {
  id: string;
  targetUrl: string;
  domain: string;
  projectId?: string;
  status: "completed" | "in_progress" | "failed";
  scanDurationMs: number;
  totalPagesScanned: number;
  businessIntelligence: BusinessIntelligence;
  tenSectionAnalysis: TenSectionAnalysis;
  // Supabase website_analyses DB compatibility alias
  business_analysis_report?: TenSectionAnalysis;
  pages_inventory?: PageInventoryItem[];
  signals: DiagnosticSignals;
  pages: PageInventoryItem[];
  findings: EvidenceFinding[];
  analyzedAt: string;
  authProvided?: boolean;
  usernameProvided?: string;
  isSimulated?: boolean;
  notice?: string;
  // 10-Step Comprehensive Enterprise Framework
  tenStepFramework?: TenStepFramework;
  // Multi-Phase Enterprise Pipeline extensions
  scope?: AnalysisScope;
  maxCrawlDepth?: number;
  viewport?: ViewportType;
  requestedModules?: AnalysisModuleType[];
  coverage?: AnalysisCoverage;
  testCases?: GeneratedTestCase[];
  limitations?: string[];
  recommendedNextActions?: string[];
  // Discovered vs Accessible vs Tested Pages separation
  discoveredPages?: string[];
  accessiblePages?: string[];
  testedPages?: PageInventoryItem[];
  // Top-Tier AI Business Analyzer Output
  businessOverview?: AiBusinessOverview;
  targetAudience?: AiTargetAudience;
  coreFeatures?: AiCoreFeature[];
  businessWorkflows?: AiBusinessWorkflows;
  authRequiredNotice?: AiAuthRequiredNotice;
  competitorInsights?: AiCompetitorInsight[];
  recommendations?: AiRecommendation[];
}
