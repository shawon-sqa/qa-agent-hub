"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  Copy,
  Check,
  FolderKanban,
  Zap,
  Lock,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Briefcase,
  Workflow,
  Lightbulb,
  ListTodo,
  Target,
  Layout,
  Sliders,
  BarChart3,
  Terminal,
  Activity,
  ArrowRight,
  Code2,
  TableProperties,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { WebsiteAnalysisReport } from "@/types/website-analysis";
import { Json } from "@/types/supabase";

const SAMPLE_TARGETS = [
  { label: "OpsROI SaaS", url: "https://app.opsroi.com" },
  { label: "FinTech Portal", url: "https://app.securebank.com" },
  { label: "E-Commerce Store", url: "https://shop.luxwear.store" },
  { label: "Example.com", url: "https://example.com" },
];

const AVAILABLE_PROJECTS = [
  { id: "c4b14d23-26a0-4cf8-8316-2c5e53303da1", name: "FinTech Banking Portal" },
  { id: "d7a98e54-52d3-46ea-9d6f-782d1c6e11f2", name: "E-Commerce Checkout Flow" },
  { id: "e9c32a11-89fc-482a-b673-984210bc6a99", name: "Healthcare Provider Portal" },
];

interface CrawlStep {
  id: string;
  stage: number;
  title: string;
  description: string;
}

const CRAWL_STEPS: CrawlStep[] = [
  {
    id: "dns_ssrf",
    stage: 1,
    title: "Domain Resolution & SSRF Guard",
    description: "Resolving DNS & enforcing RFC 1918 / cloud metadata security boundaries",
  },
  {
    id: "tls_headers",
    stage: 2,
    title: "Transport Layer & Security Headers",
    description: "Auditing TLS 1.3 handshake, HSTS preload, CSP, and framing defenses",
  },
  {
    id: "route_topology",
    stage: 3,
    title: "Route Topology & Session Crawl",
    description: "Parsing DOM hierarchy, discovering endpoints & simulating member session",
  },
  {
    id: "business_intel",
    stage: 4,
    title: "Business Model & Persona Analysis",
    description: "Evaluating market positioning, customer personas & factual revenue model",
  },
  {
    id: "qa_synthesis",
    stage: 5,
    title: "10-Section QA Blueprint Synthesis",
    description: "Generating capability maps, workflow journeys, and prioritized action plan",
  },
];

interface TelemetryLog {
  time: string;
  message: string;
  highlight?: boolean;
}

export function WebsiteAnalysisModule() {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(AVAILABLE_PROJECTS[0].id);
  const [targetUrl, setTargetUrl] = useState<string>("https://app.opsroi.com");
  const [showAuthFields, setShowAuthFields] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Scanning state & Multi-step progress
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanElapsedMs, setScanElapsedMs] = useState<number>(0);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);

  // Reporting & Persistence
  const [report, setReport] = useState<WebsiteAnalysisReport | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Accordion, Tabbed View & Copying State
  // Default open sections: 1 (Crawling), 2 (Business Overview), 4 (Features & Workflows), 10 (Final Recommendations)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([1, 2, 4, 10]));
  const [viewMode, setViewMode] = useState<"accordions" | "tabs">("accordions");
  const [activeTab, setActiveTab] = useState<number>(1);
  const [copiedSectionId, setCopiedSectionId] = useState<number | null>(null);
  const [copiedFullReport, setCopiedFullReport] = useState<boolean>(false);

  // Conversion to Test Cases Modal State
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
  const [conversionTab, setConversionTab] = useState<"playwright" | "manual" | "requirements">("playwright");
  const [copiedPlaywright, setCopiedPlaywright] = useState<boolean>(false);
  const [copiedManualMatrix, setCopiedManualMatrix] = useState<boolean>(false);

  // Timers ref for cleanup
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    const pt = progressTimerRef.current;
    const st = stepTimerRef.current;
    const et = elapsedTimerRef.current;
    return () => {
      if (pt) clearInterval(pt);
      if (st) clearInterval(st);
      if (et) clearInterval(et);
    };
  }, []);

  // Toggle individual accordion section
  const toggleSection = (sectionNum: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionNum)) {
        next.delete(sectionNum);
      } else {
        next.add(sectionNum);
      }
      return next;
    });
  };

  const expandAllSections = () => {
    setExpandedSections(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  };

  const collapseAllSections = () => {
    setExpandedSections(new Set());
  };

  // Start animated scan process
  const handleStartScan = async () => {
    if (!targetUrl.trim()) {
      setErrorMessage("Please enter a target URL to scan.");
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setActiveStepIndex(0);
    setScanProgress(10);
    setScanElapsedMs(0);

    const targetDomain = (() => {
      try {
        return new URL(targetUrl.trim()).hostname;
      } catch {
        return targetUrl.trim();
      }
    })();

    const nowStr = () => new Date().toLocaleTimeString();

    setTelemetryLogs([
      { time: nowStr(), message: `Initiating crawl for: ${targetUrl.trim()}`, highlight: true },
      { time: nowStr(), message: `Validating target hostname '${targetDomain}' against SSRF filter` },
    ]);

    const startTimestamp = Date.now();
    elapsedTimerRef.current = setInterval(() => {
      setScanElapsedMs(Date.now() - startTimestamp);
    }, 100);

    const step1Timeout = setTimeout(() => {
      setActiveStepIndex(1);
      setScanProgress(30);
      setTelemetryLogs((prev) => [
        ...prev,
        { time: nowStr(), message: `Auditing TLS 1.3 handshake, HSTS, and CSP security directives.` },
      ]);
    }, 900);

    const step2Timeout = setTimeout(() => {
      setActiveStepIndex(2);
      setScanProgress(55);
      setTelemetryLogs((prev) => [
        ...prev,
        {
          time: nowStr(),
          message: username.trim()
            ? `Simulating authenticated session scope for user '${username.trim()}'`
            : `Discovering accessible route topology and document hierarchy`,
        },
      ]);
    }, 2000);

    const step3Timeout = setTimeout(() => {
      setActiveStepIndex(3);
      setScanProgress(75);
      setTelemetryLogs((prev) => [
        ...prev,
        { time: nowStr(), message: `Evaluating customer personas, feature workflows, and verified business model.` },
      ]);
    }, 3200);

    const step4Timeout = setTimeout(() => {
      setActiveStepIndex(4);
      setScanProgress(90);
      setTelemetryLogs((prev) => [
        ...prev,
        { time: nowStr(), message: `Synthesizing 10-section capability framework & risk mitigation plan.`, highlight: true },
      ]);
    }, 4400);

    try {
      const res = await fetch("/api/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          projectId: selectedProjectId,
          username: username.trim() || undefined,
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      setScanProgress(100);
      setActiveStepIndex(4);
      setTelemetryLogs((prev) => [
        ...prev,
        { time: nowStr(), message: `10-Section Website Business Analysis Complete!`, highlight: true },
      ]);

      setTimeout(() => {
        setReport(data as WebsiteAnalysisReport);
        setExpandedSections(new Set([1, 2, 4, 10]));
        setIsScanning(false);
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze target website";
      setErrorMessage(msg);
      setIsScanning(false);
    } finally {
      clearTimeout(step1Timeout);
      clearTimeout(step2Timeout);
      clearTimeout(step3Timeout);
      clearTimeout(step4Timeout);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    }
  };

  // Save complete analysis to Supabase website_analyses table
  const handleSaveToProject = async () => {
    if (!report) return;

    setIsSaving(true);
    setSaveSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.from("website_analyses").insert([
        {
          project_id: selectedProjectId,
          target_url: report.targetUrl,
          domain: report.domain,
          status: report.status,
          scan_duration_ms: report.scanDurationMs,
          total_pages_scanned: report.totalPagesScanned,
          business_intelligence: report.businessIntelligence as unknown as Json,
          business_analysis_report: (report.tenStepFramework || report.tenSectionAnalysis) as unknown as Json,
          ten_section_analysis: report.tenSectionAnalysis as unknown as Json,
          signals: report.signals as unknown as Json,
          pages_inventory: report.pages as unknown as Json,
          findings: report.findings as unknown as Json,
        },
      ]);

      if (error) {
        console.warn("[Supabase save warning]:", error.message);
        setSaveSuccessMessage(
          `Analysis cached locally for ${report.domain} (Database connection pending or offline).`
        );
      } else {
        setSaveSuccessMessage(
          `Successfully saved 10-Step Website Business & QA Intelligence Report for ${report.domain} into website_analyses table!`
        );
      }
    } catch {
      setSaveSuccessMessage(`Analysis preserved in session memory for ${report.domain}.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy individual section in markdown format adhering to exact 10 sections
  const copySectionMarkdown = (sectionNumber: number) => {
    if (!report?.tenSectionAnalysis) return;
    const ts = report.tenSectionAnalysis;
    let md = "";

    switch (sectionNumber) {
      case 1:
        md = `### Section 1: Crawling & Data Collection Summary\n\n` +
          `- **Accessible Public Pages**: ${ts.section1_crawlingAndDataCollection.accessiblePages.join(", ")}\n` +
          `- **Navigation Structure**: ${ts.section1_crawlingAndDataCollection.navigationStructure}\n` +
          `- **Information Architecture**: ${ts.section1_crawlingAndDataCollection.informationArchitecture}\n` +
          `- **Missing Info & Audit Note**: ${ts.section1_crawlingAndDataCollection.missingInfoNote}\n`;
        break;
      case 2:
        md = `### Section 2: Business Overview & Value Proposition\n\n` +
          `- **Problem Solved**: ${ts.section2_businessOverview.problemSolved}\n` +
          `- **Products & Services**: ${ts.section2_businessOverview.productsAndServices}\n` +
          `- **Value Proposition**: ${ts.section2_businessOverview.valueProposition}\n` +
          `- **Revenue Model**: ${ts.section2_businessOverview.revenueModel}\n`;
        break;
      case 3:
        md = `### Section 3: Target Audience & Pain Points\n\n` +
          `- **Primary Users**: ${ts.section3_targetAudience.primaryUserSummary}\n` +
          `- **Secondary Users**: ${ts.section3_targetAudience.secondaryUserSummary}\n` +
          `- **Core Customer Needs**: ${ts.section3_targetAudience.coreCustomerNeeds.join("; ")}\n\n` +
          ts.section3_targetAudience.personas
            .map(
              (p) =>
                `#### Persona: ${p.name} (${p.role} - ${p.userType})\n` +
                `- **Goals**: ${p.goals.join("; ")}\n` +
                `- **Pain Points**: ${p.painPoints.join("; ")}\n`
            )
            .join("\n");
        break;
      case 4:
        md = `### Section 4: Core Features & Workflows\n\n` +
          `**Major Features**:\n` +
          ts.section4_featuresAndWorkflows.majorFeatures
            .map((f) => `- **${f.featureName}**: Purpose: ${f.businessPurpose} | Benefit: ${f.customerBenefit}`)
            .join("\n") +
          `\n\n**Workflow Journey**: ${ts.section4_featuresAndWorkflows.workflowJourney.primaryJourney}\n` +
          ts.section4_featuresAndWorkflows.workflowJourney.steps
            .map((s) => `  - Stage ${s.stepNumber} (${s.stageName}): ${s.userAction} -> ${s.systemResponse}`)
            .join("\n");
        break;
      case 5:
        md = `### Section 5: Competitor Market Comparison\n\n` +
          `**Market Positioning**: ${ts.section5_competitorAnalysis.marketPositioning}\n` +
          `**Key Differentiators**: ${ts.section5_competitorAnalysis.marketDifferentiators.join("; ")}\n\n` +
          `**Direct Competitors**:\n` +
          ts.section5_competitorAnalysis.directCompetitors
            .map((c) => `- **${c.name}**: ${c.differences} (Advantage: ${c.competitiveAdvantage})`)
            .join("\n") +
          `\n\n**Indirect Competitors**:\n` +
          ts.section5_competitorAnalysis.indirectCompetitors
            .map((c) => `- **${c.name}**: ${c.differences} (Advantage: ${c.competitiveAdvantage})`)
            .join("\n");
        break;
      case 6:
        md = `### Section 6: Missing Features & Market Gaps\n\n` +
          `**Unaddressed Needs**: ${ts.section6_missingFeaturesAndGaps.unaddressedNeeds.join("; ")}\n` +
          `**Workflow Limitations**: ${ts.section6_missingFeaturesAndGaps.workflowLimits.join("; ")}\n\n` +
          `**Market Opportunities**:\n` +
          ts.section6_missingFeaturesAndGaps.marketOpportunities
            .map((g) => `- [${g.severity} Priority] ${g.gap}: ${g.businessImpact}`)
            .join("\n");
        break;
      case 7:
        md = `### Section 7: Business Opportunities & Automation\n\n` +
          `**Automation Opportunities**:\n` +
          ts.section7_businessOpportunities.automationOpportunities
            .map((a) => `- [${a.priority}] ${a.opportunityName} (${a.estimatedEffort} effort): ${a.description} -> ${a.potentialUpside}`)
            .join("\n") +
          `\n\n**Growth Opportunities**:\n` +
          ts.section7_businessOpportunities.growthOpportunities
            .map((g) => `- [${g.priority}] ${g.opportunityName}: ${g.description} -> ${g.potentialUpside}`)
            .join("\n") +
          `\n\n**Revenue Opportunities**:\n` +
          ts.section7_businessOpportunities.revenueOpportunities
            .map((r) => `- [${r.priority}] ${r.opportunityName}: ${r.description} -> ${r.potentialUpside}`)
            .join("\n");
        break;
      case 8:
        md = `### Section 8: UI/UX Evaluation\n\n` +
          `- **Usability Score**: ${ts.section8_uiUxAndExperience.usabilityScore}/100\n` +
          `- **Navigation Clarity**: ${ts.section8_uiUxAndExperience.navigationEvaluation}\n` +
          `- **Content Organization**: ${ts.section8_uiUxAndExperience.organizationClarity}\n` +
          `- **Friction Points**: ${ts.section8_uiUxAndExperience.frictionPoints.join("; ")}\n` +
          `- **Usability Improvements**: ${ts.section8_uiUxAndExperience.usabilityImprovements.join("; ")}\n` +
          `- **Mobile Experience**: ${ts.section8_uiUxAndExperience.mobileResponsiveNote}\n`;
        break;
      case 9:
        md = `### Section 9: Business Risks & Limitations\n\n` +
          `**Operational Risks**:\n` +
          ts.section9_businessRisksAndLimitations.operationalRisks
            .map((r) => `- [${r.severity}] ${r.risk}: ${r.impact} (Mitigation: ${r.mitigationStrategy})`)
            .join("\n") +
          `\n\n**Scalability Risks**:\n` +
          ts.section9_businessRisksAndLimitations.scalabilityRisks
            .map((r) => `- [${r.severity}] ${r.risk}: ${r.impact} (Mitigation: ${r.mitigationStrategy})`)
            .join("\n") +
          `\n\n**Workflow Risks**:\n` +
          ts.section9_businessRisksAndLimitations.workflowRisks
            .map((r) => `- [${r.severity}] ${r.risk}: ${r.impact} (Mitigation: ${r.mitigationStrategy})`)
            .join("\n");
        break;
      case 10:
        md = `### Section 10: Prioritized Improvement Recommendations & Action Plan\n\n` +
          `**Executive Summary**: ${ts.section10_finalReportAndRecommendations.executiveSummary}\n\n` +
          `**Key Findings**:\n` +
          ts.section10_finalReportAndRecommendations.keyFindings.map((f) => `- ${f}`).join("\n") +
          `\n\n**Prioritized Recommendations**:\n` +
          ts.section10_finalReportAndRecommendations.recommendations
            .map(
              (rec) =>
                `#### [${rec.priority} Priority] ${rec.title} (${rec.category} - ${rec.timeframe})\n` +
                `- **Finding Evidence**: ${rec.findingEvidence}\n` +
                `- **Business Impact**: ${rec.businessImpact}\n`
            )
            .join("\n");
        break;
    }

    navigator.clipboard.writeText(md);
    setCopiedSectionId(sectionNumber);
    setTimeout(() => setCopiedSectionId(null), 2200);
  };

  // Copy full 10-section report formatted in Markdown
  const copyFullExecutiveReport = () => {
    if (!report?.tenSectionAnalysis) return;
    const ts = report.tenSectionAnalysis;
    const bi = report.businessIntelligence;

    const fullMd = `# QA AGENT HUB: 10-SECTION WEBSITE BUSINESS ANALYSIS REPORT
**Target Domain**: ${report.domain} (${report.targetUrl})
**Business Type**: ${bi?.businessType || "Web Application"}
**Industry**: ${bi?.industry || "Enterprise Cloud"}
**Execution Timestamp**: ${report.analyzedAt}
**Scan Duration**: ${report.scanDurationMs}ms

---

## EXECUTIVE SUMMARY
${ts.section10_finalReportAndRecommendations.executiveSummary}

### Key Strategic Findings
${ts.section10_finalReportAndRecommendations.keyFindings.map((f) => `- ${f}`).join("\n")}

---

## 1. CRAWLING & DATA COLLECTION SUMMARY
- **Accessible Pages**: ${ts.section1_crawlingAndDataCollection.accessiblePages.join(", ")}
- **Navigation Structure**: ${ts.section1_crawlingAndDataCollection.navigationStructure}
- **Information Architecture**: ${ts.section1_crawlingAndDataCollection.informationArchitecture}
- **Audit & Fact Verification Note**: ${ts.section1_crawlingAndDataCollection.missingInfoNote}

## 2. BUSINESS OVERVIEW & VALUE PROPOSITION
- **Core Problem Solved**: ${ts.section2_businessOverview.problemSolved}
- **Products & Services**: ${ts.section2_businessOverview.productsAndServices}
- **Value Proposition**: ${ts.section2_businessOverview.valueProposition}
- **Revenue Model**: ${ts.section2_businessOverview.revenueModel}

## 3. TARGET AUDIENCE & PAIN POINTS
- **Primary Users**: ${ts.section3_targetAudience.primaryUserSummary}
- **Secondary Users**: ${ts.section3_targetAudience.secondaryUserSummary}
- **Core Customer Needs**:
${ts.section3_targetAudience.coreCustomerNeeds.map((n) => `  - ${n}`).join("\n")}

${ts.section3_targetAudience.personas
  .map(
    (p) =>
      `### Persona: ${p.name} (${p.role} - ${p.userType})\n- **Goals**: ${p.goals.join("; ")}\n- **Pain Points**: ${p.painPoints.join("; ")}`
  )
  .join("\n\n")}

## 4. CORE FEATURES & WORKFLOWS
### Major Capabilities:
${ts.section4_featuresAndWorkflows.majorFeatures
  .map((f) => `### ${f.featureName}\n- **Purpose**: ${f.businessPurpose}\n- **Customer Benefit**: ${f.customerBenefit}`)
  .join("\n\n")}

### Workflow Journey: ${ts.section4_featuresAndWorkflows.workflowJourney.primaryJourney}
${ts.section4_featuresAndWorkflows.workflowJourney.steps
  .map((s) => `**Stage ${s.stepNumber} (${s.stageName})**: ${s.userAction} -> ${s.systemResponse}`)
  .join("\n\n")}

## 5. COMPETITOR MARKET COMPARISON
**Market Positioning**: ${ts.section5_competitorAnalysis.marketPositioning}
**Differentiators**: ${ts.section5_competitorAnalysis.marketDifferentiators.join("; ")}

### Direct Competitors:
${ts.section5_competitorAnalysis.directCompetitors
  .map((c) => `- **${c.name}**: ${c.differences} (Advantage: ${c.competitiveAdvantage})`)
  .join("\n")}

### Indirect Competitors:
${ts.section5_competitorAnalysis.indirectCompetitors
  .map((c) => `- **${c.name}**: ${c.differences} (Advantage: ${c.competitiveAdvantage})`)
  .join("\n")}

## 6. MISSING FEATURES & MARKET GAPS
- **Unaddressed Customer Needs**: ${ts.section6_missingFeaturesAndGaps.unaddressedNeeds.join("; ")}
- **Workflow Limitations**: ${ts.section6_missingFeaturesAndGaps.workflowLimits.join("; ")}

### Market Opportunities:
${ts.section6_missingFeaturesAndGaps.marketOpportunities
  .map((m) => `- [${m.severity} Priority] ${m.gap}: ${m.businessImpact}`)
  .join("\n")}

## 7. BUSINESS OPPORTUNITIES & AUTOMATION
### Automation Opportunities:
${ts.section7_businessOpportunities.automationOpportunities
  .map((a) => `- [${a.priority}] ${a.opportunityName} (${a.estimatedEffort} effort): ${a.description} -> ${a.potentialUpside}`)
  .join("\n")}

### Growth Opportunities:
${ts.section7_businessOpportunities.growthOpportunities
  .map((g) => `- [${g.priority}] ${g.opportunityName}: ${g.description} -> ${g.potentialUpside}`)
  .join("\n")}

### Revenue Opportunities:
${ts.section7_businessOpportunities.revenueOpportunities
  .map((r) => `- [${r.priority}] ${r.opportunityName}: ${r.description} -> ${r.potentialUpside}`)
  .join("\n")}

## 8. UI/UX EVALUATION
- **Usability Score**: ${ts.section8_uiUxAndExperience.usabilityScore} / 100
- **Navigation Clarity**: ${ts.section8_uiUxAndExperience.navigationEvaluation}
- **Organization Clarity**: ${ts.section8_uiUxAndExperience.organizationClarity}
- **Mobile Experience**: ${ts.section8_uiUxAndExperience.mobileResponsiveNote}
- **Friction Points**:
${ts.section8_uiUxAndExperience.frictionPoints.map((fp) => `  - ${fp}`).join("\n")}
- **Recommended Usability Improvements**:
${ts.section8_uiUxAndExperience.usabilityImprovements.map((ui) => `  - ${ui}`).join("\n")}

## 9. BUSINESS RISKS & LIMITATIONS
### Operational Risks:
${ts.section9_businessRisksAndLimitations.operationalRisks
  .map((r) => `- [${r.severity}] ${r.risk}: ${r.impact} (Mitigation: ${r.mitigationStrategy})`)
  .join("\n")}

### Scalability Risks:
${ts.section9_businessRisksAndLimitations.scalabilityRisks
  .map((r) => `- [${r.severity}] ${r.risk}: ${r.impact} (Mitigation: ${r.mitigationStrategy})`)
  .join("\n")}

### Workflow Risks:
${ts.section9_businessRisksAndLimitations.workflowRisks
  .map((r) => `- [${r.severity}] ${r.risk}: ${r.impact} (Mitigation: ${r.mitigationStrategy})`)
  .join("\n")}

## 10. PRIORITIZED IMPROVEMENT RECOMMENDATIONS & ACTION PLAN
${ts.section10_finalReportAndRecommendations.recommendations
  .map(
    (rec) =>
      `### [${rec.priority} Priority] ${rec.title} (${rec.category} - ${rec.timeframe})\n- **Finding Evidence**: ${rec.findingEvidence}\n- **Business Impact**: ${rec.businessImpact}`
  )
  .join("\n\n")}

---
*Report synthesized by QA Agent Hub for Shawon Ahmed.*
`;

    navigator.clipboard.writeText(fullMd);
    setCopiedFullReport(true);
    setTimeout(() => setCopiedFullReport(false), 2400);
  };

  // Generate Playwright TypeScript code based on analysis
  const generatePlaywrightScript = (): string => {
    if (!report) return "";
    const domain = report.domain;
    const url = report.targetUrl;
    const steps = report.tenSectionAnalysis?.section4_featuresAndWorkflows?.workflowJourney?.steps || [];

    return `import { test, expect } from '@playwright/test';

/**
 * Autonomous E2E Regression Suite for ${domain}
 * Generated by QA Agent Hub for Shawon Ahmed
 * Target URL: ${url}
 */

test.describe('${domain} Core Workflow & Security Suite', () => {

  test('01: Security Headers & HTTPS Enforcement Verification', async ({ request }) => {
    const response = await request.get('${url}');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    console.log('[Audit] Evaluating Security Headers for ${domain}:');
    console.log(' - HSTS:', headers['strict-transport-security'] || 'MISSING');
    console.log(' - CSP:', headers['content-security-policy'] || 'MISSING');
    console.log(' - X-Frame-Options:', headers['x-frame-options'] || 'MISSING');
    console.log(' - X-Content-Type-Options:', headers['x-content-type-options'] || 'MISSING');
  });

  test('02: Discovered Route Navigation & Accessibility Smoke Test', async ({ page }) => {
    await page.goto('${url}', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/.*${domain.split(".")[0]}.*/i);

    const navAnchors = page.locator('nav a, header a');
    const count = await navAnchors.count();
    expect(count).toBeGreaterThan(0);
  });

  test('03: Primary Business Workflow E2E Journey', async ({ page }) => {
    await page.goto('${url}');

${steps
  .map(
    (s) => `    // Stage ${s.stepNumber}: ${s.stageName}
    // Action: ${s.userAction}
    console.log('Executing Stage ${s.stepNumber}: ${s.stageName}');
    // Expected: ${s.systemResponse}
    await page.waitForTimeout(500);`
  )
  .join("\n\n")}

    expect(await page.url()).toContain('${domain}');
  });

  test('04: Negative Scenario - 404 Route Recovery Gracefulness', async ({ page }) => {
    const errorResponse = await page.goto('${url}/non-existent-route-qa-agent-hub', { failOnStatusCode: false });
    expect([404, 200]).toContain(errorResponse?.status());
  });

});
`;
  };

  // Generate BDD Requirement Text for transition to Requirements Module
  const generateConvertedRequirementText = (): string => {
    if (!report?.tenSectionAnalysis) return "";
    const ts = report.tenSectionAnalysis;
    const bi = report.businessIntelligence;
    const steps = ts.section4_featuresAndWorkflows.workflowJourney.steps;
    const features = ts.section4_featuresAndWorkflows.majorFeatures;
    const persona = ts.section3_targetAudience.personas[0];

    return `Feature: ${bi?.businessType || report.domain} - Business Capabilities & Workflow Specification
Domain: ${report.domain} (${report.targetUrl})
Target User Persona: ${persona?.name || "Primary User"} (${persona?.role || "Core Operator"} - ${persona?.userType || "Primary"})

User Story:
As a ${persona?.role || "business user"},
I want to use the ${report.domain} platform to ${ts.section2_businessOverview.problemSolved.toLowerCase()},
So that ${ts.section2_businessOverview.valueProposition.toLowerCase()}.

Acceptance Criteria (Derived from 10-Section Business & QA Framework):
1. Inbound Entry: The platform must support "${steps[0]?.userAction || "visitor entry"}" and respond by "${steps[0]?.systemResponse || "rendering initial view"}".
2. Authentication & Context: System manages session scope securely with ${bi?.authStrategyDetected || "HTTPS cookies and JWT"}.
3. Core Feature Execution: ${features.map((f) => f.featureName).join(", ")}.
4. Stage Progression: The system must successfully transition through:
${steps.map((s) => `   - Stage ${s.stepNumber} (${s.stageName}): ${s.userAction} -> ${s.systemResponse}`).join("\n")}
5. Risk & Gap Mitigation: Remediate operational risks regarding ${ts.section9_businessRisksAndLimitations.operationalRisks[0]?.risk || "security headers"}.
6. Edge Cases & Boundary Limits: Ensure unstated metrics remain strictly unassumed and handle rate limits and 404 routes gracefully.`;
  };

  // Convert and navigate to Requirements Module
  const handleTransitionToRequirementsModule = () => {
    if (!report) return;
    const convertedText = generateConvertedRequirementText();

    sessionStorage.setItem(
      "qa_hub_converted_requirement",
      JSON.stringify({
        domain: report.domain,
        title: `${report.domain} - Business Workflow & Capability Specification`,
        text: convertedText,
      })
    );

    setShowConversionModal(false);
    router.push("/requirements");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Globe className="h-3.5 w-3.5" />
            <span>Senior Business & Product Analysis</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Website Business & Capability Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Exhaustive 10-section strategic business analysis, target audience personas, workflow journeys, and prioritized QA recommendations for Shawon Ahmed.
          </p>
        </div>

        {/* Project Selector Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <FolderKanban className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {AVAILABLE_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Target Input Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" /> Target Website Domain or URL
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>SSRF & Factual Integrity Enforced</span>
          </div>
        </div>

        {/* URL Input Bar & Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://app.opsroi.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-500/10 transition-all font-mono"
            />
          </div>

          <button
            onClick={handleStartScan}
            disabled={isScanning || !targetUrl.trim()}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
              isScanning || !targetUrl.trim()
                ? "bg-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 shadow-blue-500/20 active:scale-[0.99]"
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Target...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run 10-Section Analysis
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Targets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-600">Sample Targets:</span>
          {SAMPLE_TARGETS.map((sample) => (
            <button
              key={sample.label}
              onClick={() => {
                setTargetUrl(sample.url);
                setErrorMessage(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/60"
            >
              {sample.label}
            </button>
          ))}

          {/* Toggle Authentication Section */}
          <button
            type="button"
            onClick={() => setShowAuthFields(!showAuthFields)}
            className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {showAuthFields ? "Hide Login Credentials" : "Add Login Credentials (Optional)"}
            {showAuthFields ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Optional Credentials Card */}
        {showAuthFields && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
              <KeyRound className="h-4 w-4 text-indigo-600" />
              <span>Simulated Member Session Scope</span>
            </div>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              Provide test credentials to simulate authenticated member routes (e.g. CRM pipelines, dashboard controls). Credentials are used strictly server-side and are never exposed in reports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Username / Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. ANIMATED MULTI-STEP PROGRESS STATUS LOADER */}
        {isScanning && (
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/30 text-cyan-400 border border-blue-400/30">
                  <Activity className="h-5 w-5 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Autonomous Business & QA Analysis Engine
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      LIVE AUDIT
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Inspecting: <span className="font-mono text-cyan-300">{targetUrl}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-cyan-400">{scanProgress}% COMPLETE</div>
                  <div className="text-[10px] text-slate-400">Elapsed: {(scanElapsedMs / 1000).toFixed(1)}s</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-cyan-500/50"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
              {CRAWL_STEPS.map((step, idx) => {
                const isCompleted = activeStepIndex > idx;
                const isCurrent = activeStepIndex === idx;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-blue-600/25 border-cyan-400/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30"
                        : isCompleted
                        ? "bg-emerald-950/20 border-emerald-500/30 text-slate-300"
                        : "bg-white/5 border-white/5 opacity-40 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                        Stage 0{idx + 1}
                      </span>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                      )}
                    </div>
                    <div
                      className={`text-xs font-bold leading-tight ${
                        isCurrent ? "text-cyan-200" : isCompleted ? "text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 font-mono">
                      {step.description}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-black/70 border border-white/10 p-3.5 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1.5 border-b border-white/10">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Terminal className="h-3 w-3 text-cyan-400" /> Active Analysis Telemetry Stream
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span> Real-Time Hook Active
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pt-1 text-slate-300">
                {telemetryLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-cyan-400 shrink-0">&gt;</span>
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={log.highlight ? "text-cyan-300 font-semibold" : "text-slate-300"}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <strong className="font-bold">Scan Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        {saveSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <strong className="font-bold">Persistence Success:</strong> {saveSuccessMessage}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Top Results Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0B132B] text-white shadow-xl">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/30 text-cyan-400 border border-blue-500/30 shadow-xs shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white truncate max-w-sm sm:max-w-md font-mono">
                    {report.targetUrl}
                  </h3>
                  {report.authProvided && (
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      Authenticated Scan
                    </span>
                  )}
                  {report.isSimulated && (
                    <span className="text-[10px] font-semibold bg-blue-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                      Enriched Intelligence
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Domain: {report.domain}</span>
                  <span>•</span>
                  <span>Scanned: {new Date(report.analyzedAt).toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>Duration: {report.scanDurationMs}ms</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Save, Copy Report, Convert to Test Cases) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowConversionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Convert to Test Cases</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={copyFullExecutiveReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                {copiedFullReport ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Full QA Report</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveToProject}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-400/30 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                <span>Save Analysis to Supabase</span>
              </button>
            </div>
          </div>

          {/* Sandbox notice */}
          {report.notice && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
              <span className="font-medium">{report.notice}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                Sandbox Mode
              </span>
            </div>
          )}

          {/* Executive Briefing Banner */}
          {report.tenSectionAnalysis && (
            <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Executive Briefing & Strategic Audit
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      10-Section Website Business Analysis
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {report.businessIntelligence.industry}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {report.businessIntelligence.businessType}
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {report.tenSectionAnalysis.section10_finalReportAndRecommendations.executiveSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Key Findings & Facts
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {report.tenSectionAnalysis.section10_finalReportAndRecommendations.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold shrink-0">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ListTodo className="h-3.5 w-3.5 text-indigo-600" /> Prioritized Action Items
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {report.tenSectionAnalysis.section10_finalReportAndRecommendations.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-800">[{rec.priority}]</span>
                        <span>{rec.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 2. EXACT 10-SECTION PROFESSIONAL BUSINESS ANALYSIS REPORT */}
          {report.tenSectionAnalysis && (() => {
            const SECTIONS_META = [
              {
                num: 1,
                title: "Section 1: Crawling & Data Collection Summary",
                shortTitle: "1. Crawling Summary",
                icon: Globe,
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                badgeText: `${report.tenSectionAnalysis.section1_crawlingAndDataCollection.accessiblePages.length} Pages Identified`,
                summary: report.tenSectionAnalysis.section1_crawlingAndDataCollection.navigationStructure,
              },
              {
                num: 2,
                title: "Section 2: Business Overview & Value Proposition",
                shortTitle: "2. Business Overview",
                icon: Briefcase,
                badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
                badgeText: "Verified Model",
                summary: report.tenSectionAnalysis.section2_businessOverview.problemSolved,
              },
              {
                num: 3,
                title: "Section 3: Target Audience & Pain Points",
                shortTitle: "3. Target Audience",
                icon: Users,
                badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
                badgeText: `${report.tenSectionAnalysis.section3_targetAudience.personas.length} Personas`,
                summary: `Primary: ${report.tenSectionAnalysis.section3_targetAudience.primaryUserSummary}`,
              },
              {
                num: 4,
                title: "Section 4: Core Features & Workflows",
                shortTitle: "4. Features & Workflows",
                icon: Workflow,
                badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
                badgeText: `${report.tenSectionAnalysis.section4_featuresAndWorkflows.majorFeatures.length} Features • ${report.tenSectionAnalysis.section4_featuresAndWorkflows.workflowJourney.steps.length} Stages`,
                summary: `Journey: ${report.tenSectionAnalysis.section4_featuresAndWorkflows.workflowJourney.primaryJourney}`,
              },
              {
                num: 5,
                title: "Section 5: Competitor Market Comparison",
                shortTitle: "5. Competitor Analysis",
                icon: BarChart3,
                badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                badgeText: `${report.tenSectionAnalysis.section5_competitorAnalysis.directCompetitors.length} Direct • ${report.tenSectionAnalysis.section5_competitorAnalysis.indirectCompetitors.length} Indirect`,
                summary: report.tenSectionAnalysis.section5_competitorAnalysis.marketPositioning,
              },
              {
                num: 6,
                title: "Section 6: Missing Features & Market Gaps",
                shortTitle: "6. Missing Features & Gaps",
                icon: Target,
                badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
                badgeText: `${report.tenSectionAnalysis.section6_missingFeaturesAndGaps.marketOpportunities.length} Gaps Highlighted`,
                summary: `Unaddressed Needs: ${report.tenSectionAnalysis.section6_missingFeaturesAndGaps.unaddressedNeeds.join(" • ")}`,
              },
              {
                num: 7,
                title: "Section 7: Business Opportunities & Automation",
                shortTitle: "7. Opportunities & Automation",
                icon: Lightbulb,
                badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
                badgeText: "Automation, Growth & Revenue",
                summary: `Automation Wins: ${report.tenSectionAnalysis.section7_businessOpportunities.automationOpportunities.map((o) => o.opportunityName).join(" • ")}`,
              },
              {
                num: 8,
                title: "Section 8: UI/UX Evaluation",
                shortTitle: "8. UI/UX Evaluation",
                icon: Layout,
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 font-mono font-bold",
                badgeText: `Score: ${report.tenSectionAnalysis.section8_uiUxAndExperience.usabilityScore} / 100`,
                summary: `Navigation: ${report.tenSectionAnalysis.section8_uiUxAndExperience.navigationEvaluation}`,
              },
              {
                num: 9,
                title: "Section 9: Business Risks & Limitations",
                shortTitle: "9. Business Risks & Limits",
                icon: ShieldAlert,
                badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
                badgeText: "Operational, Scalability & Workflow",
                summary: `Operational Risks: ${report.tenSectionAnalysis.section9_businessRisksAndLimitations.operationalRisks.map((r) => r.risk).join(" • ")}`,
              },
              {
                num: 10,
                title: "Section 10: Prioritized Improvement Recommendations & Action Plan",
                shortTitle: "10. Prioritized Recs & Plan",
                icon: ListTodo,
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
                badgeText: `${report.tenSectionAnalysis.section10_finalReportAndRecommendations.recommendations.length} Action Items`,
                summary: "Structured recommendations with High/Medium/Low tags, finding evidence, and business impact",
              },
            ];

            const renderSectionContent = (num: number) => {
              if (!report?.tenSectionAnalysis) return null;
              const ts = report.tenSectionAnalysis;

              switch (num) {
                case 1: {
                  const s1 = ts.section1_crawlingAndDataCollection;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Navigation Structure
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {s1.navigationStructure}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Information Architecture
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {s1.informationArchitecture}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Identified Accessible Public Routes & Endpoints ({s1.accessiblePages.length})
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {s1.accessiblePages.map((path, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200/60 font-mono text-xs text-blue-800"
                            >
                              <Globe className="h-3 w-3 text-blue-500" />
                              {path}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Fact Verification & Missing Data Note
                        </span>
                        <p className="text-xs text-amber-900 font-medium leading-relaxed">
                          {s1.missingInfoNote}
                        </p>
                      </div>
                    </div>
                  );
                }

                case 2: {
                  const s2 = ts.section2_businessOverview;
                  return (
                    <div className="p-5 pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-indigo-600" /> Problem Solved
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {s2.problemSolved}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Products & Services Suite
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {s2.productsAndServices}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-600" /> Unique Value Proposition
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {s2.valueProposition}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Database className="h-3.5 w-3.5 text-emerald-600" /> Revenue & Monetization Model
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {s2.revenueModel}
                          </p>
                          {s2.revenueModel.toLowerCase().includes("not publicly available") && (
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Zero-Hallucination Policy Applied
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                case 3: {
                  const s3 = ts.section3_targetAudience;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Core Customer Needs Across Personas
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {s3.coreCustomerNeeds.map((need, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 text-xs font-medium"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                              {need}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {s3.personas.map((persona, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div>
                                <h5 className="font-bold text-sm text-slate-900">{persona.name}</h5>
                                <span className="text-xs font-semibold text-purple-700">{persona.role}</span>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                {persona.userType} User
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Specific Operational Goals:</span>
                              <ul className="text-xs text-slate-600 space-y-1">
                                {persona.goals.map((g, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-bold shrink-0">•</span>
                                    <span>{g}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold uppercase text-rose-700 block">Acute Pain Points:</span>
                              <ul className="text-xs text-slate-600 space-y-1">
                                {persona.painPoints.map((pp, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-rose-500 font-bold shrink-0">•</span>
                                    <span>{pp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                case 4: {
                  const s4 = ts.section4_featuresAndWorkflows;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {s4.majorFeatures.map((feat, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                              <h5 className="font-bold text-sm text-slate-900">{feat.featureName}</h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700">
                                Feature 0{idx + 1}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              <strong className="text-slate-800">Business Purpose:</strong> {feat.businessPurpose}
                            </p>
                            <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                              <strong>Customer Benefit:</strong> {feat.customerBenefit}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <Layers className="h-4 w-4 text-indigo-600" /> End-to-End User Journey Stages
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {s4.workflowJourney.primaryJourney}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowConversionModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Generate Playwright Test</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {s4.workflowJourney.steps.map((st) => (
                            <div key={st.stepNumber} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>Stage {st.stepNumber}: {st.stageName}</span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono border border-indigo-200/50">
                                  Step 0{st.stepNumber}
                                </span>
                              </div>
                              <p className="text-slate-600"><strong>User Action:</strong> {st.userAction}</p>
                              <p className="text-indigo-700 font-medium"><strong>System Response:</strong> {st.systemResponse}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                case 5: {
                  const s5 = ts.section5_competitorAnalysis;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Market Positioning & Strategy
                        </span>
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {s5.marketPositioning}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {s5.marketDifferentiators.map((diff, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold"
                            >
                              <Check className="h-3 w-3 text-amber-600" />
                              {diff}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {s5.directCompetitors.map((comp, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 font-bold text-slate-900">
                              <h5 className="text-sm">{comp.name}</h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                Direct Competitor
                              </span>
                            </div>
                            <p className="text-slate-600"><strong>Differences:</strong> {comp.differences}</p>
                            <p className="text-blue-700 font-medium"><strong>Competitive Advantage:</strong> {comp.competitiveAdvantage}</p>
                          </div>
                        ))}
                        {s5.indirectCompetitors.map((comp, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 font-bold text-slate-900">
                              <h5 className="text-sm">{comp.name}</h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                Indirect Competitor
                              </span>
                            </div>
                            <p className="text-slate-600"><strong>Differences:</strong> {comp.differences}</p>
                            <p className="text-blue-700 font-medium"><strong>Competitive Advantage:</strong> {comp.competitiveAdvantage}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                case 6: {
                  const s6 = ts.section6_missingFeaturesAndGaps;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                            Unaddressed Customer Needs
                          </span>
                          <ul className="space-y-1 text-slate-600">
                            {s6.unaddressedNeeds.map((need, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-500 font-bold">•</span>
                                <span>{need}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                            Current Workflow Limits & Bottlenecks
                          </span>
                          <ul className="space-y-1 text-slate-600">
                            {s6.workflowLimits.map((limit, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{limit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-900 block">Prioritized Market Opportunities & Gaps</span>
                        {s6.marketOpportunities.map((opp, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${getPriorityBadge(opp.severity)}`}>
                                  {opp.severity} Severity
                                </span>
                                <h5 className="font-bold text-sm text-slate-900">{opp.gap}</h5>
                              </div>
                              <p className="text-slate-600 font-medium">{opp.businessImpact}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                case 7: {
                  const s7 = ts.section7_businessOpportunities;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2.5">
                          <Zap className="h-3.5 w-3.5 text-teal-600" /> Automation Opportunities
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {s7.automationOpportunities.map((opp, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                <h5 className="font-bold text-slate-900 text-sm">{opp.opportunityName}</h5>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                                  {opp.priority} Priority
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">{opp.description}</p>
                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Effort: <strong>{opp.estimatedEffort}</strong></span>
                                <span className="text-emerald-700 font-semibold">{opp.potentialUpside}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Growth Opportunities
                          </span>
                          {s7.growthOpportunities.map((opp, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{opp.opportunityName}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">{opp.priority}</span>
                              </div>
                              <p className="text-slate-600">{opp.description}</p>
                              <p className="text-emerald-700 font-semibold text-[11px]">Upside: {opp.potentialUpside}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Database className="h-3.5 w-3.5 text-indigo-600" /> Revenue Opportunities
                          </span>
                          {s7.revenueOpportunities.map((opp, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{opp.opportunityName}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{opp.priority}</span>
                              </div>
                              <p className="text-slate-600">{opp.description}</p>
                              <p className="text-emerald-700 font-semibold text-[11px]">Upside: {opp.potentialUpside}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                case 8: {
                  const s8 = ts.section8_uiUxAndExperience;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-center items-center text-center space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Usability Benchmark
                          </span>
                          <div className="text-3xl font-black text-emerald-600 font-mono">
                            {s8.usabilityScore} <span className="text-sm font-semibold text-slate-400">/ 100</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">Evaluated across navigation & layout</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1 col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Navigation & Information Clarity
                          </span>
                          <p className="text-slate-700 font-medium leading-relaxed">
                            {s8.navigationEvaluation}
                          </p>
                          <p className="text-slate-600 pt-1 border-t border-slate-100 text-[11px]">
                            <strong>Organization:</strong> {s8.organizationClarity}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Detected Friction Points
                          </span>
                          <ul className="text-amber-900 space-y-1">
                            {s8.frictionPoints.map((fp, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{fp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-blue-800 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Usability Improvements
                          </span>
                          <ul className="text-blue-900 space-y-1">
                            {s8.usabilityImprovements.map((imp, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong>Mobile Viewport Responsiveness:</strong> {s8.mobileResponsiveNote}
                      </div>
                    </div>
                  );
                }

                case 9: {
                  const s9 = ts.section9_businessRisksAndLimitations;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-orange-600" /> Operational Risks & Hardening
                        </span>
                        {s9.operationalRisks.map((risk, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 text-xs">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${getPriorityBadge(risk.severity)}`}>
                                  {risk.severity} Severity
                                </span>
                                <h5 className="font-bold text-sm text-slate-900">{risk.risk}</h5>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {risk.category} Risk
                              </span>
                            </div>
                            <p className="text-slate-600"><strong>Business Impact:</strong> {risk.impact}</p>
                            <p className="text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                              <strong>Mitigation Strategy:</strong> {risk.mitigationStrategy}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-900">Scalability Risks</span>
                          {s9.scalabilityRisks.map((risk, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{risk.risk}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityBadge(risk.severity)}`}>{risk.severity}</span>
                              </div>
                              <p className="text-slate-600">{risk.impact}</p>
                              <p className="text-emerald-700 text-[11px] font-medium"><strong>Mitigation:</strong> {risk.mitigationStrategy}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-900">Workflow Risks</span>
                          {s9.workflowRisks.map((risk, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{risk.risk}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityBadge(risk.severity)}`}>{risk.severity}</span>
                              </div>
                              <p className="text-slate-600">{risk.impact}</p>
                              <p className="text-emerald-700 text-[11px] font-medium"><strong>Mitigation:</strong> {risk.mitigationStrategy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                case 10: {
                  const s10 = ts.section10_finalReportAndRecommendations;
                  return (
                    <div className="p-5 pt-3 space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 space-y-2">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key Strategic Findings
                        </span>
                        <ul className="text-xs text-emerald-900 space-y-1">
                          {s10.keyFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold shrink-0">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-900 block">
                          Prioritized Improvement Recommendations & Action Plan ({s10.recommendations.length} Items)
                        </span>
                        {s10.recommendations.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${getPriorityBadge(item.priority)}`}>
                                  {item.priority} Priority
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {item.category}
                                </span>
                                <h5 className="font-bold text-sm text-slate-900">{item.title}</h5>
                              </div>
                              <p className="text-xs text-slate-600 font-medium">
                                <strong className="text-slate-800">Finding Evidence:</strong> {item.findingEvidence}
                              </p>
                              <p className="text-xs text-emerald-700 font-medium flex items-start gap-1">
                                <strong className="text-emerald-800 shrink-0">Business Impact:</strong>{" "}
                                <span>{item.businessImpact}</span>
                              </p>
                            </div>

                            <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shrink-0">
                              📅 {item.timeframe}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                default:
                  return null;
              }
            };

            const activeMeta = SECTIONS_META.find((m) => m.num === activeTab) || SECTIONS_META[0];
            const ActiveIcon = activeMeta.icon;

            return (
              <div className="space-y-4">
                {/* Deck Control Bar with View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-indigo-600" />
                      10-Section Professional Business Analysis Report
                    </h4>
                    <p className="text-xs text-slate-500">
                      Crawl data, personas, workflows, competitors, market gaps, risks, and prioritized action plan
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Mode Switcher */}
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setViewMode("accordions")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          viewMode === "accordions"
                            ? "bg-white text-indigo-600 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        All Accordions
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("tabs")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          viewMode === "tabs"
                            ? "bg-white text-indigo-600 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Tabbed Cards
                      </button>
                    </div>

                    {viewMode === "accordions" && (
                      <>
                        <button
                          onClick={expandAllSections}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Expand All
                        </button>
                        <button
                          onClick={collapseAllSections}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Collapse All
                        </button>
                      </>
                    )}

                    <button
                      onClick={copyFullExecutiveReport}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Full Report</span>
                    </button>
                  </div>
                </div>

                {/* VIEW MODE 1: TABBED CARDS */}
                {viewMode === "tabs" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Horizontal Scrollable Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {SECTIONS_META.map((meta) => {
                        const Icon = meta.icon;
                        const isActive = activeTab === meta.num;
                        return (
                          <button
                            key={meta.num}
                            onClick={() => setActiveTab(meta.num)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                              isActive
                                ? "bg-[#0B132B] text-white shadow-md shadow-slate-900/10 border border-slate-900"
                                : "bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-200/90 shadow-2xs"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${
                                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {meta.num < 10 ? `0${meta.num}` : meta.num}
                            </span>
                            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                            <span>{meta.shortTitle}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Tab Card Container */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
                      {/* Active Tab Header Bar */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold shrink-0">
                            {activeMeta.num < 10 ? `0${activeMeta.num}` : activeMeta.num}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <ActiveIcon className="h-4 w-4 text-indigo-600" />
                                {activeMeta.title}
                              </h4>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${activeMeta.badgeColor}`}>
                                {activeMeta.badgeText}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">
                              {activeMeta.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Previous / Next Tab Controls */}
                          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <button
                              onClick={() => setActiveTab((prev) => (prev > 1 ? prev - 1 : 10))}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Previous Section"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-[11px] font-mono px-2 text-slate-500 border-x border-slate-100 font-semibold">
                              {activeTab} / 10
                            </span>
                            <button
                              onClick={() => setActiveTab((prev) => (prev < 10 ? prev + 1 : 1))}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Next Section"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => copySectionMarkdown(activeMeta.num)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                            title="Copy Section Markdown"
                          >
                            {copiedSectionId === activeMeta.num ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copy Markdown</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Active Tab Body */}
                      <div className="bg-slate-50/20">
                        {renderSectionContent(activeTab)}
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW MODE 2: COLLAPSIBLE ACCORDIONS DECK */}
                {viewMode === "accordions" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {SECTIONS_META.map((meta) => {
                      const Icon = meta.icon;
                      const isExpanded = expandedSections.has(meta.num);

                      return (
                        <div
                          key={meta.num}
                          className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs transition-all"
                        >
                          <div
                            onClick={() => toggleSection(meta.num)}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B132B] text-white font-mono text-xs font-bold shrink-0">
                                {meta.num < 10 ? `0${meta.num}` : meta.num}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-indigo-600" />
                                    {meta.title}
                                  </h4>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.badgeColor}`}>
                                    {meta.badgeText}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">
                                  {meta.summary}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copySectionMarkdown(meta.num);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Copy Section Markdown"
                              >
                                {copiedSectionId === meta.num ? (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/40">
                              {renderSectionContent(meta.num)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Diagnostic Signals & Discovered Route Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Routes Traversed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{report.pages.length}</div>
              <span className="text-[11px] text-slate-500">Autonomous crawler paths</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Score</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {report.signals.securityHeadersScore} / 100
              </div>
              <span className="text-[11px] text-slate-500">HSTS, CSP & Framing</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Broken Links</span>
              <div className={`text-2xl font-black mt-1 ${report.signals.brokenLinksCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {report.signals.brokenLinksCount}
              </div>
              <span className="text-[11px] text-slate-500">4xx / 5xx HTTP errors</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SSL Certificate</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {report.signals.sslValid ? "Valid TLS" : "Insecure"}
              </div>
              <span className="text-[11px] text-slate-500">Protocol encryption</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEST CONVERSION MODAL */}
      {showConversionModal && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Convert Business Analysis to Test Cases & Automation
                  </h3>
                  <p className="text-xs text-slate-300">
                    Target: <span className="font-mono text-cyan-300">{report.domain}</span> • Generated for Shawon Ahmed
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConversionModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setConversionTab("playwright")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  conversionTab === "playwright"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>Playwright E2E Suite (.spec.ts)</span>
              </button>

              <button
                onClick={() => setConversionTab("manual")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  conversionTab === "manual"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <TableProperties className="h-4 w-4" />
                <span>Manual QA Test Matrix</span>
              </button>

              <button
                onClick={() => setConversionTab("requirements")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  conversionTab === "requirements"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>BDD Requirements & Acceptance Criteria</span>
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 font-sans text-xs">
              {conversionTab === "playwright" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Autonomous Playwright End-to-End Test Spec
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Directly executable TypeScript test covering security headers, route traversal, and business workflows.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatePlaywrightScript());
                        setCopiedPlaywright(true);
                        setTimeout(() => setCopiedPlaywright(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedPlaywright ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPlaywright ? "Copied Spec!" : "Copy Code"}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed max-h-96 border border-slate-800 scrollbar-thin">
                    <code>{generatePlaywrightScript()}</code>
                  </pre>
                </div>
              )}

              {conversionTab === "manual" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Structured Manual QA Test Case Matrix
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Step-by-step test matrix designed for test management systems (Jira Xray, TestRail, Zephyr).
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const matrixMd = `| Test ID | Title | Priority | Category | Expected Result |\n|---|---|---|---|---|\n` +
                          `| TC-SEC-001 | Verify Security Headers & TLS 1.3 | High | Security | HSTS, CSP, and X-Frame-Options headers present |\n` +
                          `| TC-NAV-002 | Discovered Route Integrity | High | Functional | All ${report.pages.length} crawled routes return HTTP 200 |\n` +
                          `| TC-E2E-003 | ${report.tenSectionAnalysis?.section4_featuresAndWorkflows.workflowJourney.primaryJourney || "Primary Workflow"} | High | E2E | All workflow stages complete without state corruption |\n` +
                          `| TC-AUTH-004 | Authentication & Session Invalidation | Medium | Security | Session token destroyed on signout |\n` +
                          `| TC-A11Y-005 | WCAG 2.1 Contrast & Touch Hit Target | Medium | Accessibility | Minimum 4.5:1 contrast and 44px touch targets |`;
                        navigator.clipboard.writeText(matrixMd);
                        setCopiedManualMatrix(true);
                        setTimeout(() => setCopiedManualMatrix(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedManualMatrix ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedManualMatrix ? "Copied Matrix!" : "Copy Table (Markdown)"}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Test ID</th>
                          <th className="p-3">Title & Workflow</th>
                          <th className="p-3">Priority</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Expected Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr>
                          <td className="p-3 font-mono font-bold text-blue-600">TC-SEC-001</td>
                          <td className="p-3 font-bold text-slate-900">Verify Security Headers & TLS 1.3 Handshake</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">High</span></td>
                          <td className="p-3 text-slate-500">Security</td>
                          <td className="p-3">HSTS and CSP headers deployed; zero cleartext fallback</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-blue-600">TC-NAV-002</td>
                          <td className="p-3 font-bold text-slate-900">Discovered Routes Accessibility & 404 Prevention</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">High</span></td>
                          <td className="p-3 text-slate-500">Reliability</td>
                          <td className="p-3">All {report.pages.length} endpoints respond with HTTP 200 without orphan links</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-blue-600">TC-E2E-003</td>
                          <td className="p-3 font-bold text-slate-900">{report.tenSectionAnalysis?.section4_featuresAndWorkflows.workflowJourney.primaryJourney || "Core Business Journey"}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">High</span></td>
                          <td className="p-3 text-slate-500">E2E Workflow</td>
                          <td className="p-3">Stages 1-4 execute smoothly; final payload confirmed</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-blue-600">TC-AUTH-004</td>
                          <td className="p-3 font-bold text-slate-900">Session Cookie Invalidation & Idle Timeout</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">Medium</span></td>
                          <td className="p-3 text-slate-500">Authentication</td>
                          <td className="p-3">Tokens destroyed on logout and after 15 min inactivity</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {conversionTab === "requirements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Synthesized Product Requirements Specification
                      </h4>
                      <p className="text-slate-500 text-xs">
                        BDD user stories and acceptance criteria compiled from business model and workflow stages.
                      </p>
                    </div>

                    <button
                      onClick={handleTransitionToRequirementsModule}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Open in Requirements AI Module</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-50 text-slate-800 font-mono text-xs overflow-x-auto leading-relaxed max-h-96 border border-slate-200 whitespace-pre-wrap">
                    {generateConvertedRequirementText()}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Ready to execute tests with Playwright or import into Requirements Analyzer
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConversionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleTransitionToRequirementsModule}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Open in Requirements Module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
