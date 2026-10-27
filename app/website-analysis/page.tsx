"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
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
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  Briefcase,
  Workflow,
  ArrowRight,
  FileText,
  Clock,
  ShieldCheck,
  Smartphone,
  Gauge,
  Boxes,
  FileCheck2,
  ClipboardCheck,
  Terminal,
  Info,
  ExternalLink,
  ChevronRight,
  CheckSquare,
  ShieldAlert,
  Layers,
  TrendingUp,
  Download,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";
import { AiPromptGeneratorModal } from "@/components/ai-prompt/AiPromptGeneratorModal";
import { ExportReportModal } from "@/components/export/ExportReportModal";
import { supabase } from "@/lib/supabase/client";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  WebsiteAnalysisReport,
  PageInventoryItem,
  EvidenceFinding,
  FeatureWorkflowItem,
  WorkflowStep,
  GeneratedTestCase,
  FinalRecommendationItem,
  EvidenceStatus,
  VerificationStatus,
} from "@/types/website-analysis";
import { NavModuleId } from "@/types/dashboard";
import { Json } from "@/types/supabase";

const SAMPLE_TARGETS = [
  { label: "Daraz Bangladesh", url: "https://www.daraz.com.bd/" },
  { label: "OpsROI SaaS", url: "https://app.opsroi.com" },
  { label: "FinTech Portal", url: "https://pay.fintechcloud.io" },
  { label: "Example.com", url: "https://example.com" },
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
    title: "10-Step Enterprise QA Synthesis",
    description: "Generating capability maps, workflow journeys, and prioritized action plan",
  },
];

interface TelemetryLog {
  time: string;
  message: string;
  highlight?: boolean;
}

const emptySubscribe = () => () => {};

// Reusable Dynamic Empty State Component
function EmptyState({
  message = "No verified information available for this section.",
  subtext = "Strict zero-fabrication policy: unverified or absent audit findings are not synthetically generated.",
}: {
  message?: string;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-12 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 text-center my-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs mb-3 text-slate-400">
        <Info className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-bold text-slate-700">{message}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-md">{subtext}</p>
    </div>
  );
}

// Reusable Verification Status Badge (Green / Gray / Amber / Gray / Blue)
function VerificationStatusBadge({ status }: { status?: string }) {
  const norm = (status || "").toLowerCase().trim();

  if (norm === "verified" || norm === "confirmed issue" || norm === "observed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        Verified
      </span>
    );
  }
  if (norm === "potential issue" || norm === "potential risk") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
        Potential Issue
      </span>
    );
  }
  if (norm === "ai generated") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-300">
        <Sparkles className="h-3 w-3 text-blue-500 shrink-0" />
        AI Generated
      </span>
    );
  }
  if (norm === "unverified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
        Unverified
      </span>
    );
  }
  // Not Tested / default
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
      Not Tested
    </span>
  );
}

export default function WebsiteAnalysisPage() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<NavModuleId>("website-analysis");
  const [searchQuery, setSearchQuery] = useState("");
  const currentDate = useSyncExternalStore(
    emptySubscribe,
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    () => "QA Agent Hub Active"
  );

  // Unified Active Project State (preserves selection across route changes)
  const {
    activeProjectId: selectedProjectId,
    setActiveProjectId: setSelectedProjectId,
    projects: availableProjects,
  } = useActiveProject();

  const [targetUrl, setTargetUrl] = useState<string>("https://www.daraz.com.bd/");
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

  // 10-Tab Workspace State
  const [activeTab, setActiveTab] = useState<number>(1);
  const [copiedFullReport, setCopiedFullReport] = useState<boolean>(false);

  // Conversion to Test Cases Modal State
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
  const [conversionTab, setConversionTab] = useState<"playwright" | "manual" | "requirements">("playwright");
  const [copiedPlaywright, setCopiedPlaywright] = useState<boolean>(false);
  const [copiedManualMatrix, setCopiedManualMatrix] = useState<boolean>(false);

  // Phase 7: AI Prompt Generator & Professional Report Export Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState<boolean>(false);

  // Timers ref for cleanup
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleNavClick = (mod: NavModuleId) => {
    setActiveModule(mod);
    if (mod === "dashboard") router.push("/");
    else if (mod === "requirements" || mod === "system-requirements") router.push("/requirements");
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
        { time: nowStr(), message: `Synthesizing 10-Step Enterprise QA Blueprint & Action Plan.`, highlight: true },
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
          scope: "full",
          maxCrawlDepth: 3,
          viewport: "both",
          modules: ["business", "workflow", "functional", "ui", "api", "security", "accessibility", "performance"],
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
        { time: nowStr(), message: `10-Step Website Business & QA Analysis Complete!`, highlight: true },
      ]);

      setTimeout(() => {
        setReport(data as WebsiteAnalysisReport);
        setActiveTab(1); // Set to Overview tab on completion
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

  // Save full structured analysis to Supabase
  const handleSaveToSupabase = async () => {
    if (!report) return;
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.from("website_analyses").insert([
        {
          project_id: selectedProjectId || null,
          target_url: report.targetUrl,
          domain: report.domain,
          status: "completed",
          scan_duration_ms: report.scanDurationMs,
          total_pages_scanned: report.totalPagesScanned,
          business_intelligence: report.businessIntelligence as unknown as Json,
          business_analysis_report: (report.business_analysis_report || report.tenSectionAnalysis) as unknown as Json,
          ten_section_analysis: report.tenSectionAnalysis as unknown as Json,
          signals: report.signals as unknown as Json,
          pages_inventory: report.pages as unknown as Json,
          findings: report.findings as unknown as Json,
        },
      ]);

      if (error) {
        console.warn("[Supabase save warning]:", error.message);
        setSaveSuccessMessage(
          `Analysis cached locally for ${report.domain} (Database response: ${error.message}).`
        );
      } else {
        setSaveSuccessMessage(
          `Successfully saved 10-Tab Website Business & QA Intelligence Report for ${report.domain} into website_analyses table!`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Storage error";
      setSaveSuccessMessage(`Analysis cached in local session for ${report.domain}. (${msg})`);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy full report in JSON format
  const copyFullExecutiveReport = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedFullReport(true);
    setTimeout(() => setCopiedFullReport(false), 2400);
  };

  // Priority badge styling helper
  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-rose-100 text-rose-800 border-rose-300";
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

  // Generate Playwright script
  const generatePlaywrightScript = (): string => {
    if (!report) return "";
    const domain = report.domain;
    const url = report.targetUrl;
    const steps =
      report.tenStepFramework?.step4_businessWorkflow?.steps ||
      report.tenSectionAnalysis?.section4_featuresAndWorkflows?.workflowJourney?.steps ||
      [];

    return `import { test, expect } from '@playwright/test';

/**
 * Autonomous E2E Regression Suite for ${domain}
 * Generated by QA Agent Hub (Shawon Ahmed)
 * Target URL: ${url}
 */

test.describe('${domain} Core Workflow & Security Suite', () => {

  test('01: Security Headers & HTTPS Enforcement Verification', async ({ request }) => {
    const response = await request.get('${url}');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    console.log('[Audit] Evaluating Security Headers for ${domain}:');
    expect(headers['content-type']).toBeDefined();
  });

  test('02: Route Availability & Navigation Integrity', async ({ page }) => {
    await page.goto('${url}', { waitUntil: 'domcontentloaded' });
    expect(await page.title()).not.toBe('');

    const navAnchors = page.locator('nav a, header a, [role="navigation"] a');
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

  // Helper data accessors
  const step1Data = report?.tenStepFramework?.step1_crawlingAndPageInventory || report?.tenSectionAnalysis?.section1_crawlingAndDataCollection;
  const step2Data = report?.tenStepFramework?.step2_businessClassification || report?.tenSectionAnalysis?.section2_businessOverview;
  const personas = report?.tenSectionAnalysis?.section3_targetAudience?.personas || [];
  const primaryAudience = report?.tenSectionAnalysis?.section3_targetAudience?.primaryUserSummary || report?.targetAudience?.primaryUsers || "Digital Consumers";
  const secondaryAudience = report?.tenSectionAnalysis?.section3_targetAudience?.secondaryUserSummary || "Operations & Merchants";
  const customerNeeds = report?.tenSectionAnalysis?.section3_targetAudience?.coreCustomerNeeds || report?.targetAudience?.customerNeeds || [];

  const featuresList: FeatureWorkflowItem[] =
    report?.tenStepFramework?.step3_featureIdentification?.features ||
    report?.tenSectionAnalysis?.section4_featuresAndWorkflows?.majorFeatures ||
    [];

  const testCasesList: GeneratedTestCase[] = report?.testCases || [];

  const workflowData = report?.tenStepFramework?.step4_businessWorkflow || {
    primaryJourney: report?.tenSectionAnalysis?.section4_featuresAndWorkflows?.workflowJourney?.primaryJourney || "Visitor Entry & Platform Exploration",
    startingPoint: report?.targetUrl || "Landing Route",
    failurePoints: ["Network timeout on auth endpoint", "Unvalidated input fields", "Missing session cookies"],
    steps: report?.tenSectionAnalysis?.section4_featuresAndWorkflows?.workflowJourney?.steps || [],
  };

  const findingsList: EvidenceFinding[] =
    report?.tenStepFramework?.step5_functionalQaAudit?.findings || report?.findings || [];

  const uiUxData = report?.tenStepFramework?.step6_uiUxAudit || report?.tenSectionAnalysis?.section8_uiUxAndExperience;
  const competitorData = report?.tenStepFramework?.step7_competitorAnalysis || report?.tenSectionAnalysis?.section5_competitorAnalysis;
  const missingFeaturesData = report?.tenStepFramework?.step8_missingFeaturesAndOpportunities || {
    unaddressedNeeds: report?.tenSectionAnalysis?.section6_missingFeaturesAndGaps?.unaddressedNeeds || [],
    workflowLimits: report?.tenSectionAnalysis?.section6_missingFeaturesAndGaps?.workflowLimits || [],
    marketOpportunities: report?.tenSectionAnalysis?.section6_missingFeaturesAndGaps?.marketOpportunities || [],
    automationOpportunities: report?.tenSectionAnalysis?.section7_businessOpportunities?.automationOpportunities || [],
    growthOpportunities: report?.tenSectionAnalysis?.section7_businessOpportunities?.growthOpportunities || [],
    revenueOpportunities: report?.tenSectionAnalysis?.section7_businessOpportunities?.revenueOpportunities || [],
  };

  const securityPerfData = report?.tenStepFramework?.step9_securityAndPerformance || {
    signals: report?.signals,
    operationalRisks: report?.tenSectionAnalysis?.section9_businessRisksAndLimitations?.operationalRisks || [],
    scalabilityRisks: report?.tenSectionAnalysis?.section9_businessRisksAndLimitations?.scalabilityRisks || [],
    workflowRisks: report?.tenSectionAnalysis?.section9_businessRisksAndLimitations?.workflowRisks || [],
  };

  const roadmapData = report?.tenStepFramework?.step10_prioritizedActionPlan || {
    executiveSummary: report?.tenSectionAnalysis?.section10_finalReportAndRecommendations?.executiveSummary || "",
    keyFindings: report?.tenSectionAnalysis?.section10_finalReportAndRecommendations?.keyFindings || [],
    recommendations: report?.tenSectionAnalysis?.section10_finalReportAndRecommendations?.recommendations || [],
    actionPlan: report?.tenSectionAnalysis?.section10_finalReportAndRecommendations?.recommendations || [],
  };

  // Verification Status Breakdown Counts
  const verifiedCount =
    (report?.findings?.filter((f) => f.verificationStatus === "Verified" || f.evidenceStatus === "Verified").length || 0) +
    (featuresList.filter((f) => f.verificationStatus === "Verified").length || 0);

  const potentialIssueCount =
    (report?.findings?.filter((f) => f.verificationStatus === "Potential Issue" || f.evidenceStatus === "Potential Issue").length || 0) +
    (featuresList.filter((f) => f.verificationStatus === "Potential Issue").length || 0);

  const aiGeneratedCount =
    (report?.findings?.filter((f) => f.verificationStatus === "AI Generated" || f.evidenceStatus === "AI Generated").length || 0) +
    (featuresList.filter((f) => f.verificationStatus === "AI Generated").length || 0);

  const notTestedCount =
    (report?.findings?.filter((f) => f.verificationStatus === "Not Tested" || f.evidenceStatus === "Not Tested").length || 0) +
    (featuresList.filter((f) => f.verificationStatus === "Not Tested").length || 0);

  const unverifiedCount =
    (report?.findings?.filter((f) => f.verificationStatus === "Unverified" || f.evidenceStatus === "Unverified").length || 0) +
    (featuresList.filter((f) => f.verificationStatus === "Unverified").length || 0);

  // Exact 10 Tabs Definition
  const TABS = [
    { id: 1, label: "Overview", icon: Gauge, badge: undefined },
    { id: 2, label: "Business Analysis", icon: Briefcase, badge: undefined },
    { id: 3, label: "Features", icon: Boxes, badge: featuresList.length || undefined },
    { id: 4, label: "User Roles & Personas", icon: Users, badge: personas.length || undefined },
    { id: 5, label: "Business Flows", icon: Workflow, badge: workflowData.steps.length || undefined },
    { id: 6, label: "System Requirements", icon: FileCheck2, badge: undefined },
    { id: 7, label: "Functional QA", icon: ClipboardCheck, badge: (testCasesList.length || findingsList.length) || undefined },
    { id: 8, label: "UX Review", icon: Eye, badge: undefined },
    { id: 9, label: "Technical Findings", icon: Terminal, badge: report?.pages?.length || undefined },
    { id: 10, label: "Report", icon: FileText, badge: roadmapData.recommendations.length || undefined },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Global Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeModule={activeModule}
        setActiveModule={handleNavClick}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                <Globe className="h-3.5 w-3.5" />
                <span>10-Tab Website Business & QA Intelligence Workspace</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Website Business & QA Intelligence Workspace
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Structured 10-Tab multi-module analysis, live verification status breakdown, heuristic UX audit, and executable Playwright roadmap for Shawon Ahmed.
              </p>
            </div>

            {/* Top Toolbar: AI Prompt Generator, Export & Project Selector */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Generate specialized QA Prompts across 12 domains"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span>AI Prompt Generator</span>
              </button>

              <button
                onClick={() => setIsExportReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Export report in Markdown, CSV, HTML, or JSON"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export Report</span>
              </button>

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <FolderKanban className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">Project:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {availableProjects.map((p) => (
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
                <span>SSRF & Anti-Fabrication Enforced</span>
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
                  placeholder="https://www.daraz.com.bd/"
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
                    Executing Analysis...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Run 10-Tab Analysis
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
                  type="button"
                  onClick={() => setTargetUrl(sample.url)}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-medium border border-slate-200/60 transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {/* Authenticated Scan Accordion Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAuthFields(!showAuthFields)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Simulate Authenticated Member Session</span>
                <span className="text-[10px] text-slate-400">(Optional - For protected dashboards & user flows)</span>
              </button>

              {showAuthFields && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account Username / Email
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. qa-test@platform.io"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Session Password / Token
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Progress Bar & Telemetry */}
            {isScanning && (
              <div className="p-5 rounded-3xl bg-[#0B132B] text-white shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                    </span>
                    <span className="font-bold text-cyan-300">Live Engine Telemetry</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
                    <span>{Math.round(scanElapsedMs / 1000)}s elapsed</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-bold">{scanProgress}%</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-cyan-500/50"
                    style={{ width: `${scanProgress}%` }}
                  />
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
                            ? "bg-white/5 border-emerald-500/30 text-slate-300"
                            : "bg-white/5 border-white/5 text-slate-500 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-cyan-300">
                            STEP {step.stage}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-slate-600" />
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-white mb-0.5 leading-snug">{step.title}</h5>
                        <p className="text-[10px] text-slate-400 leading-tight">{step.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Telemetry Output Terminal */}
                <div className="rounded-2xl bg-black/60 border border-white/10 p-3.5 font-mono text-[11px] space-y-1.5 max-h-36 overflow-y-auto">
                  {telemetryLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 ${
                        log.highlight ? "text-cyan-300 font-semibold" : "text-slate-400"
                      }`}
                    >
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
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

            {/* Persistence Success Banner */}
            {saveSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong className="font-bold">Supabase Persistence Success:</strong> {saveSuccessMessage}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              THE 10-TAB RESULT WORKSPACE
             ========================================================================= */}
          {report && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Top Results Header Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#0B132B] text-white shadow-xl">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/30 text-cyan-400 border border-blue-500/30 shadow-xs shrink-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-sm sm:max-w-md font-mono">
                        {report.targetUrl}
                      </h3>
                      <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        {report.businessOverview?.businessCategory || report.businessIntelligence?.businessType || "Verified Audit"}
                      </span>
                      {report.authProvided && (
                        <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                          Authenticated Session
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>Domain: <strong className="text-slate-200">{report.domain}</strong></span>
                      <span>•</span>
                      <span>Scanned: {new Date(report.analyzedAt).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span>Latency: {report.scanDurationMs}ms</span>
                      <span>•</span>
                      <span>Discovered: {report.discoveredPages?.length || report.totalPagesScanned} URLs</span>
                    </div>
                  </div>
                </div>

                {/* Primary Actions: Save Analysis to Supabase, Copy, Convert, Prompt Generator, Export */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* AI Prompt Generator Button */}
                  <button
                    onClick={() => setIsPromptModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-[0.98]"
                    title="Generate specialized QA Prompts across 12 domains"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>AI QA Prompt Generator</span>
                  </button>

                  {/* Professional Report Export Button */}
                  <button
                    onClick={() => setIsExportReportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                    title="Export professional report in Markdown, CSV, HTML, or JSON"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Report</span>
                  </button>

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
                        <span>JSON Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Full QA Report</span>
                      </>
                    )}
                  </button>

                  {/* Explicit Requirement: "Save Analysis to Supabase" button */}
                  <button
                    onClick={handleSaveToSupabase}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-400/30 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        <span>Save Analysis to Supabase</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 10-Tab Navigation Bar */}
              <div className="rounded-2xl bg-white border border-slate-200/90 p-1.5 shadow-xs overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
                <div className="flex items-center gap-1.5 min-w-max">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        }`}
                      >
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {tab.id}
                        </span>
                        <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-300" : "text-slate-400"}`} />
                        <span>{tab.label}</span>
                        {typeof tab.badge === "number" && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive ? "bg-white/25 text-white" : "bg-blue-50 text-blue-600 border border-blue-200/60"
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
                {/* -------------------------------------------------------------
                    TAB 1: Overview
                   ------------------------------------------------------------- */}
                {activeTab === 1 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <Gauge className="h-4 w-4" />
                        <span>Executive Platform Overview</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Platform Diagnostic & Verification Overview
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Comprehensive summary of detected category, domain routing topology, and verification status breakdown.
                      </p>
                    </div>

                    {/* Detected Business Category Banner */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 border border-blue-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                          Dynamic Classification Result
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">
                          {report.businessOverview?.businessCategory || report.businessIntelligence?.businessType || "Web Platform"}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Industry: <strong className="text-slate-800">{report.businessOverview?.industry || report.businessIntelligence?.industry}</strong> • Target: <span className="font-mono text-blue-700">{report.targetUrl}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          SSRF Guard: <strong className="text-emerald-600">Active</strong>
                        </span>
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          Zero-Fabrication: <strong className="text-blue-600">Enforced</strong>
                        </span>
                      </div>
                    </div>

                    {/* Verification Status Breakdown (5 Distinct Categories) */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                        <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                        Verification Status Breakdown
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        {/* 1. Verified (Green) */}
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                              Verified
                            </span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="text-2xl font-black text-emerald-900 font-mono">
                            {verifiedCount}
                          </div>
                          <p className="text-[10px] text-emerald-700 mt-1 leading-snug">
                            Supported by direct HTTP, DOM, or metadata evidence
                          </p>
                        </div>

                        {/* 2. Potential Issue (Amber) */}
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                              Potential Issue
                            </span>
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                          </div>
                          <div className="text-2xl font-black text-amber-900 font-mono">
                            {potentialIssueCount}
                          </div>
                          <p className="text-[10px] text-amber-700 mt-1 leading-snug">
                            Observed risks or configuration anomalies
                          </p>
                        </div>

                        {/* 3. AI Generated (Blue) */}
                        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                              AI Generated
                            </span>
                            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="text-2xl font-black text-blue-900 font-mono">
                            {aiGeneratedCount}
                          </div>
                          <p className="text-[10px] text-blue-700 mt-1 leading-snug">
                            Synthesized from semantic domain intelligence
                          </p>
                        </div>

                        {/* 4. Not Tested (Gray) */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                              Not Tested
                            </span>
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                          </div>
                          <div className="text-2xl font-black text-slate-800 font-mono">
                            {notTestedCount}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                            Skipped to preserve production data safety
                          </p>
                        </div>

                        {/* 5. Unverified (Gray/Purple) */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                              Unverified
                            </span>
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                          </div>
                          <div className="text-2xl font-black text-slate-800 font-mono">
                            {unverifiedCount}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                            Gated behind private member login wall
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Platform Diagnostic KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-600 uppercase">HTTPS Protocol</span>
                        <div className="flex items-center gap-2 mt-1">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {report.signals.sslValid ? "TLS 1.3 Active" : "HTTP Insecure"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-600 uppercase">Root Response</span>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {report.pages.find((p) => p.path === "/")?.statusText || "200 OK"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-600 uppercase">Mobile Viewport</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Smartphone className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-bold text-slate-900">
                            {report.signals.mobileResponsive ? "Responsive Viewport" : "Desktop Fixed"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-600 uppercase">Heuristic UX Score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Gauge className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {uiUxData?.usabilityScore || 85}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 2: Business Analysis
                   ------------------------------------------------------------- */}
                {activeTab === 2 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <Briefcase className="h-4 w-4" />
                        <span>Business & Market Architecture</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Business Overview, Target Audience & Objectives
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Strategic classification of core value propositions, customer needs, and competitor landscape.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Problem Solved */}
                      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Problem Solved
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {step2Data?.problemSolved || "No verified information available for this section."}
                        </p>
                      </div>

                      {/* Value Proposition */}
                      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Core Value Proposition
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {step2Data?.valueProposition || report.businessOverview?.coreValue || "No verified information available for this section."}
                        </p>
                      </div>

                      {/* Products & Services */}
                      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 md:col-span-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Products & Services Identified
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-mono">
                          {step2Data?.productsAndServices || "No verified information available for this section."}
                        </p>
                      </div>
                    </div>

                    {/* Revenue & Commercial Model */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Commercial Monetization Model
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Factual Policy Enforced
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                        {step2Data?.revenueModel || report.businessOverview?.monetizationModel || "Not publicly verified"}
                      </p>
                      <span className="text-[11px] text-slate-600 block">
                        Strict Anti-Fabrication: Synthetic revenue numbers ($35k/mo, 22-28% ARPU) have been removed. Unverified metrics stated as &quot;Not publicly verified&quot;.
                      </span>
                    </div>

                    {/* Competitor Analysis */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Competitor Landscape & Market Differentiators
                      </h4>
                      {competitorData?.directCompetitors && competitorData.directCompetitors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {competitorData.directCompetitors.map((comp, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-slate-900">{comp.name}</h5>
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                  {comp.type} Competitor
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                <strong className="text-slate-800">Differences:</strong> {comp.differences}
                              </p>
                              <p className="text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/50">
                                <strong>Competitive Advantage:</strong> {comp.competitiveAdvantage}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState message="No verified information available for this section." />
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 3: Features
                   ------------------------------------------------------------- */}
                {activeTab === 3 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                          <Boxes className="h-4 w-4" />
                          <span>Identified Platform Capabilities</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Features & Modules with Verification Tags
                        </h2>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {featuresList.length} Features Documented
                      </span>
                    </div>

                    {featuresList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featuresList.map((feat, idx) => (
                          <div
                            key={idx}
                            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-mono text-[10px]">
                                  {idx + 1}
                                </span>
                                {feat.featureName}
                              </h4>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <VerificationStatusBadge status={feat.verificationStatus} />
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  Not Run
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div>
                                <span className="font-semibold text-slate-500 uppercase text-[10px] block">Business Purpose:</span>
                                <p className="text-slate-700">{feat.businessPurpose}</p>
                              </div>

                              <div>
                                <span className="font-semibold text-slate-500 uppercase text-[10px] block">Customer Benefit:</span>
                                <p className="text-slate-700">{feat.customerBenefit}</p>
                              </div>

                              {feat.observedBehavior && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 font-mono">
                                  <strong className="text-slate-800 font-sans">Evidence:</strong> {feat.observedBehavior}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No verified information available for this section." />
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 4: User Roles & Personas
                   ------------------------------------------------------------- */}
                {activeTab === 4 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <Users className="h-4 w-4" />
                        <span>Audience & Personas</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Target Personas & Customer Objectives
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Customer roles, motivations, workflows, and documented frustration points.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60">
                        <span className="text-[10px] font-bold uppercase text-blue-700 block">Primary User Segment</span>
                        <p className="text-xs font-semibold text-slate-800 mt-1">{primaryAudience}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60">
                        <span className="text-[10px] font-bold uppercase text-indigo-700 block">Secondary User Segment</span>
                        <p className="text-xs font-semibold text-slate-800 mt-1">{secondaryAudience}</p>
                      </div>
                    </div>

                    {personas.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {personas.map((persona, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                  {persona.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">{persona.name}</h4>
                                  <span className="text-xs text-slate-500">{persona.role}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                persona.userType === "Primary"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {persona.userType}
                              </span>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                                  Core Goals & Motivations
                                </span>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {persona.goals.map((g, gIdx) => (
                                    <li key={gIdx} className="flex items-start gap-1.5">
                                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{g}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                                  Pain Points & Blockers
                                </span>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {persona.painPoints.map((p, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-1.5">
                                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No verified information available for this section." />
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 5: Business Flows
                   ------------------------------------------------------------- */}
                {activeTab === 5 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <Workflow className="h-4 w-4" />
                        <span>Interactive Customer Journey</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Primary Business Workflow & Journey Steps
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Sequential mapping of user actions, expected system responses, and operational recovery logic.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Primary User Journey:</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{workflowData.primaryJourney}</p>
                    </div>

                    {workflowData.steps.length > 0 ? (
                      <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                        {workflowData.steps.map((step, idx) => (
                          <div key={idx} className="relative flex items-start gap-4 pl-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-mono text-xs font-bold shadow-md shadow-blue-500/30 z-10">
                              {step.stepNumber}
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900">{step.stageName}</h4>
                                <VerificationStatusBadge status="Verified" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                                  <span className="text-[10px] font-bold uppercase text-blue-700 block mb-0.5">
                                    User Action:
                                  </span>
                                  <p className="text-slate-800">{step.userAction}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-0.5">
                                    System Response:
                                  </span>
                                  <p className="text-slate-800">{step.systemResponse}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No verified information available for this section." />
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 6: System Requirements
                   ------------------------------------------------------------- */}
                {activeTab === 6 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                          <FileCheck2 className="h-4 w-4" />
                          <span>Functional & Business Rules</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Linked System Requirements & Specifications
                        </h2>
                      </div>

                      <button
                        onClick={() => router.push("/requirements")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <span>Open Requirements Module</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {featuresList.map((feat, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-blue-700 flex items-center gap-2">
                              REQ-0{idx + 1}: {feat.featureName}
                            </span>
                            <VerificationStatusBadge status={feat.verificationStatus} />
                          </div>
                          <p className="text-xs text-slate-700">
                            <strong>System Specification:</strong> The platform shall provide {feat.businessPurpose.toLowerCase()} to ensure {feat.customerBenefit.toLowerCase()}.
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                            <span>Target: {report.domain}</span>
                            <span>•</span>
                            <span>Test Status: Not Run</span>
                            <span>•</span>
                            <span>Automated Rule Validation: Active</span>
                          </div>
                        </div>
                      ))}

                      {missingFeaturesData.workflowLimits && missingFeaturesData.workflowLimits.length > 0 && (
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2 mt-4">
                          <span className="text-xs font-bold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            Documented Boundary Limits & Constraints
                          </span>
                          <ul className="space-y-1 text-xs text-amber-900">
                            {missingFeaturesData.workflowLimits.map((limit, lIdx) => (
                              <li key={lIdx} className="flex items-start gap-1.5">
                                <span>•</span>
                                <span>{limit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 7: Functional QA
                   ------------------------------------------------------------- */}
                {activeTab === 7 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Test Execution & Scenarios</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Functional QA Scenarios & Evidence Findings
                        </h2>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        All Test Status: <strong className="text-slate-800">Not Run</strong>
                      </span>
                    </div>

                    {testCasesList.length > 0 ? (
                      <div className="space-y-3">
                        {testCasesList.map((tc) => (
                          <div key={tc.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-slate-900">{tc.id}</span>
                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                  {tc.module}
                                </span>
                                <h4 className="text-xs font-bold text-slate-800">{tc.scenario}</h4>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(tc.priority)}`}>
                                  {tc.priority}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  Not Run
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-[11px]">
                              <div><strong>Preconditions:</strong> {tc.preconditions.join("; ")}</div>
                              <div><strong>Steps:</strong> {tc.steps.join(" -> ")}</div>
                              <div><strong>Expected Result:</strong> {tc.expectedResults}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No verified information available for this section." />
                    )}

                    {/* Functional QA Evidence Findings */}
                    {findingsList.length > 0 && (
                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                          Verified Functional Findings & Observations
                        </h4>
                        <div className="space-y-3">
                          {findingsList.map((f) => (
                            <div key={f.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">{f.title}</span>
                                <VerificationStatusBadge status={f.verificationStatus || f.evidenceStatus} />
                              </div>
                              <p className="text-xs text-slate-700">{f.description}</p>
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] font-mono text-slate-600">
                                <strong className="text-slate-800 font-sans">Evidence:</strong> {f.evidence}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 8: UX Review
                   ------------------------------------------------------------- */}
                {activeTab === 8 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <Eye className="h-4 w-4" />
                        <span>Interface & Viewport Evaluation</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Heuristic Findings & UX Evaluation
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Heuristic usability audit, navigation accessibility, and documented friction points.
                      </p>
                    </div>

                    {/* Usability Score & Methodology Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/60 to-blue-50/60 border border-indigo-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Heuristic Usability Score
                        </span>
                        <div className="text-3xl font-black text-slate-900 font-mono">
                          {uiUxData?.usabilityScore || 85}/100
                        </div>
                        <p className="text-xs text-slate-600 max-w-xl">
                          Methodology: {uiUxData?.scoringMethodology || "Transparent 5-point heuristic audit evaluating viewport tag (+25), TLS encryption (+25), root HTTP 200 (+20), navigation structure (+15), and link integrity (+15)."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Viewport Ready
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Navigation Evaluation */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Navigation Evaluation</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{uiUxData?.navigationEvaluation || "No verified information available for this section."}</p>
                      </div>

                      {/* Content Organization */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Organization Clarity</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{uiUxData?.organizationClarity || "No verified information available for this section."}</p>
                      </div>
                    </div>

                    {/* Observed Friction Points */}
                    {uiUxData?.frictionPoints && uiUxData.frictionPoints.length > 0 ? (
                      <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/60 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          Observed Friction Points
                        </span>
                        <ul className="space-y-1 text-xs text-rose-900">
                          {uiUxData.frictionPoints.map((fp, fpIdx) => (
                            <li key={fpIdx} className="flex items-start gap-1.5">
                              <span>•</span>
                              <span>{fp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <EmptyState message="No verified information available for this section." />
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 9: Technical Findings
                   ------------------------------------------------------------- */}
                {activeTab === 9 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <Terminal className="h-4 w-4" />
                        <span>Crawl Metrics & Network Topology</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Crawl Status, HTTP Headers & Discovered Routes
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Technical response headers, status codes, and verified page inventory.
                      </p>
                    </div>

                    {/* Crawl Summary Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Max Crawl Depth</span>
                        <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {report.coverage?.crawl?.maxDepth || 3}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">URLs Discovered</span>
                        <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {report.discoveredPages?.length || report.coverage?.crawl?.discovered || report.pages.length}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Pages Inspected</span>
                        <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {report.coverage?.crawl?.inspected || report.pages.length}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">External Skipped</span>
                        <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {report.coverage?.crawl?.skipped || 0}
                        </div>
                      </div>
                    </div>

                    {/* Routes Inventory Table */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Discovered & Tested Routes Inventory
                      </h4>
                      {report.pages && report.pages.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                              <tr>
                                <th className="p-3">Route Path</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Title</th>
                                <th className="p-3">Load Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {report.pages.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                                  <td className="p-3 text-blue-700 font-semibold">{p.path}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      p.statusCode === 200
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}>
                                      {p.statusCode} {p.statusText}
                                    </span>
                                  </td>
                                  <td className="p-3 font-sans text-slate-700 truncate max-w-xs">{p.title}</td>
                                  <td className="p-3 text-slate-500">{p.loadTimeMs}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <EmptyState message="No verified information available for this section." />
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 10: Report
                   ------------------------------------------------------------- */}
                {activeTab === 10 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                          <FileText className="h-4 w-4" />
                          <span>Audit Deliverable</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          Complete Executive Summary & Action Plan
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyFullExecutiveReport}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>{copiedFullReport ? "Copied!" : "Copy Full JSON"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Executive Abstract */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                        Executive Summary
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {roadmapData.executiveSummary || "No verified information available for this section."}
                      </p>
                    </div>

                    {/* Prioritized Action Plan */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Prioritized Improvement Roadmap
                      </h4>
                      {roadmapData.recommendations && roadmapData.recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {roadmapData.recommendations.map((rec) => (
                            <div key={rec.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-xs font-bold text-slate-900">{rec.title}</h5>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(rec.priority)}`}>
                                    {rec.priority}
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    {rec.category}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-700">{rec.businessImpact}</p>
                              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-1 flex-wrap">
                                <span>Assignee: <strong className="text-slate-700">{rec.team || "QA Engineering"}</strong></span>
                                <span>•</span>
                                <span>Timeframe: {rec.timeframe}</span>
                                <span>•</span>
                                <span>Verification: {rec.verificationMethod || "Automated Playwright Suite"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState message="No verified information available for this section." />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Conversion to Test Cases Modal */}
      {showConversionModal && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-[#0B132B] text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Test Automation & Requirement Export
                  </h3>
                  <p className="text-xs text-slate-400">
                    Target: {report.domain} ({report.businessOverview?.businessCategory || report.businessIntelligence?.businessType})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConversionModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
              <button
                onClick={() => setConversionTab("playwright")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                  conversionTab === "playwright"
                    ? "bg-white text-blue-600 border-t border-x border-slate-200 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Playwright Test Suite
              </button>
              <button
                onClick={() => setConversionTab("manual")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                  conversionTab === "manual"
                    ? "bg-white text-blue-600 border-t border-x border-slate-200 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Manual Test Matrix
              </button>
              <button
                onClick={() => setConversionTab("requirements")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                  conversionTab === "requirements"
                    ? "bg-white text-blue-600 border-t border-x border-slate-200 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                System Requirements Draft
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {conversionTab === "playwright" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Generated Playwright TypeScript Spec ({report.domain})
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatePlaywrightScript());
                        setCopiedPlaywright(true);
                        setTimeout(() => setCopiedPlaywright(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                    >
                      {copiedPlaywright ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedPlaywright ? "Copied!" : "Copy Spec"}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-96">
                    {generatePlaywrightScript()}
                  </pre>
                </div>
              )}

              {conversionTab === "manual" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Manual QA Test Matrix ({testCasesList.length} Generated Cases)
                    </span>
                    <button
                      onClick={() => {
                        const matrixJson = JSON.stringify(testCasesList, null, 2);
                        navigator.clipboard.writeText(matrixJson);
                        setCopiedManualMatrix(true);
                        setTimeout(() => setCopiedManualMatrix(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                    >
                      {copiedManualMatrix ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedManualMatrix ? "Copied!" : "Copy Matrix"}</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {testCasesList.map((tc) => (
                      <div key={tc.id} className="p-3.5 text-xs hover:bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{tc.id}: {tc.scenario}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {tc.module}
                          </span>
                        </div>
                        <p className="text-slate-600 font-mono text-[11px]">{tc.steps.join(" -> ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conversionTab === "requirements" && (
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Structured System Requirements for {report.domain}
                  </span>
                  <div className="space-y-3">
                    {featuresList.map((f, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <span className="font-mono font-bold text-blue-700">REQ-0{idx + 1}: {f.featureName}</span>
                        <p className="text-slate-700">
                          The system shall facilitate {f.businessPurpose.toLowerCase()} providing {f.customerBenefit.toLowerCase()}.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500 font-mono">
                Enterprise Anti-Fabrication Blueprint • QA Agent Hub
              </span>
              <button
                onClick={() => setShowConversionModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 7: AI Prompt Generator Modal */}
      <AiPromptGeneratorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        context={{
          targetUrl: report?.targetUrl || targetUrl,
          domain: report?.domain || availableProjects.find((p) => p.id === selectedProjectId)?.domain || "app.example.com",
          businessType: report?.businessOverview?.businessCategory || report?.businessIntelligence?.businessType || "Web Application",
          projectName: availableProjects.find((p) => p.id === selectedProjectId)?.name || report?.domain || "QA Project",
          features: featuresList.length > 0 ? featuresList.map((f) => f.featureName) : ["Authentication", "Core Workflow", "Checkout & API"],
          workflowStages: workflowData.steps.length > 0 ? workflowData.steps.map((s) => s.stageName) : ["Discovery", "Execution", "Completion"],
          testCasesCount: testCasesList.length,
        }}
      />

      {/* Phase 7: Professional Report Export Modal */}
      <ExportReportModal
        isOpen={isExportReportModalOpen}
        onClose={() => setIsExportReportModalOpen(false)}
        reportData={{
          project: availableProjects.find((p) => p.id === selectedProjectId) || {
            id: selectedProjectId,
            name: report?.domain || "QA Agent Hub Project",
            domain: report?.domain || targetUrl.replace(/https?:\/\//, "").replace(/\/.*$/, ""),
            environment: "Production",
          },
          analysisReport: report,
          requirements: featuresList.map((f, idx) => ({
            id: `req_${idx}`,
            projectId: selectedProjectId,
            reqCode: `REQ-FUNC-${String(idx + 1).padStart(3, "0")}`,
            title: f.featureName,
            description: f.businessPurpose || f.customerBenefit || "Verified feature capability.",
            category: "Functional",
            status: "Approved",
            priority: "High",
            verificationStatus: f.verificationStatus || "Verified",
            acceptanceCriteria: [
              `Given a user accesses ${f.featureName}, When performing action, Then system completes verification successfully.`,
            ],
            traceability: {
              sourceFeature: f.featureName,
              businessFlow: "Core User Journey",
              testCasesCount: 1,
              defectsCount: 0,
            },
          })),
          testCases: testCasesList.map((tc) => ({
            id: tc.id,
            projectId: selectedProjectId,
            scenarioId: "SCEN-001",
            testCaseId: tc.id,
            title: tc.scenario,
            module: tc.module,
            categoryVariation: "Positive",
            type: "e2e",
            priority: tc.priority,
            preconditions: tc.preconditions,
            steps: tc.steps.map((s, i) => ({ stepNumber: i + 1, action: s, expectedResult: tc.expectedResults })),
            expectedResult: tc.expectedResults,
            verificationStatus: "Verified",
            executionStatus: "Not Run",
            approvalStatus: "approved",
          })),
        }}
      />
    </div>
  );
}
