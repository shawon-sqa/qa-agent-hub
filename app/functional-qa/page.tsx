"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardCheck,
  Sparkles,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Filter,
  Search,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Bug,
  Terminal,
  FileCheck2,
  Workflow,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  CheckSquare,
  Flame,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";
import { supabase } from "@/lib/supabase/client";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  FunctionalTestCase,
  TestCasePriority,
  TestCaseType,
  TestExecutionStatus,
  TestCategoryVariation,
  TestCaseExecutionStep,
} from "@/types/functional-qa";
import { SystemRequirement } from "@/types/requirements";
import { BusinessFlow } from "@/types/business-flows";
import {
  generateTestCasesFromRequirementsAndFlows,
  generateVariationsForTestCase,
  generateDomainTailoredTestCases,
  executeTestCaseSimulation,
} from "@/lib/functional-qa/testCaseEngine";
import { Json } from "@/types/supabase";

export default function FunctionalQaPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const { activeProjectId, activeProject } = useActiveProject();

  const [testCases, setTestCases] = useState<FunctionalTestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [executingTcId, setExecutingTcId] = useState<string | null>(null);

  // Execution Modal / Log Console State
  const [activeConsoleTc, setActiveConsoleTc] = useState<FunctionalTestCase | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleRunning, setConsoleRunning] = useState(false);

  // Filters State
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedExecutionStatus, setSelectedExecutionStatus] = useState<string>("All");
  const [selectedVariation, setSelectedVariation] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Expanded Steps in Matrix
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [statusNotification, setStatusNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    setStatusNotification({ type, message });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  // 1. Fetch test cases for active project from Supabase
  const fetchTestCases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("test_cases")
        .select("*")
        .eq("project_id", activeProjectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not query test_cases from Supabase:", error.message);
      }

      if (data && data.length > 0) {
        const mapped: FunctionalTestCase[] = data.map((row, index) => {
          const stepsObj = (row.steps as Record<string, unknown>) || {};
          let parsedSteps: TestCaseExecutionStep[] = [];

          if (Array.isArray(row.steps)) {
            parsedSteps = (row.steps as unknown[]).map((s, idx) => {
              if (typeof s === "string") {
                return { stepNumber: idx + 1, action: s, expectedResult: row.expected_result, status: "Not Run" };
              }
              const stepRecord = s as Record<string, unknown>;
              return {
                stepNumber: (stepRecord.stepNumber as number) || idx + 1,
                action: (stepRecord.action as string) || "Execute verification",
                expectedResult: (stepRecord.expectedResult as string) || row.expected_result,
                status: "Not Run",
              };
            });
          }

          if (parsedSteps.length === 0) {
            parsedSteps = [
              {
                stepNumber: 1,
                action: `Verify ${row.title}`,
                expectedResult: row.expected_result,
                status: "Not Run",
              },
            ];
          }

          const rawExecStatus = (stepsObj.executionStatus as TestExecutionStatus) || (row.status === "passed" ? "Passed" : row.status === "failed" ? "Failed" : "Not Run");

          return {
            id: row.id,
            projectId: row.project_id,
            scenarioId: (stepsObj.scenarioId as string) || `SCEN-${String(Math.floor(index / 2) + 1).padStart(3, "0")}`,
            testCaseId: (stepsObj.testCaseId as string) || `TC-${row.type.toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
            requirementId: row.requirement_id,
            requirementCode: stepsObj.requirementCode as string,
            flowId: stepsObj.flowId as string,
            flowCode: stepsObj.flowCode as string,
            title: row.title,
            module: (stepsObj.module as string) || (row.type === "security" ? "Security" : row.type === "api" ? "API" : "General"),
            categoryVariation: (stepsObj.categoryVariation as TestCategoryVariation) || "Positive",
            type: row.type as TestCaseType,
            priority: row.priority as TestCasePriority,
            preconditions: Array.isArray(stepsObj.preconditions) ? (stepsObj.preconditions as string[]) : [`Environment: ${activeProject.environment}`],
            steps: parsedSteps,
            expectedResult: row.expected_result,
            verificationStatus: (stepsObj.verificationStatus as FunctionalTestCase["verificationStatus"]) || "Verified",
            executionStatus: rawExecStatus,
            approvalStatus: row.status === "active" ? "approved" : "draft",
            executionDurationMs: stepsObj.executionDurationMs as number,
            executionLogs: stepsObj.executionLogs as string[],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        setTestCases(mapped);
      } else {
        const defaults = generateDomainTailoredTestCases(activeProject);
        setTestCases(defaults);
      }
    } catch (err) {
      console.error("Error fetching test cases:", err);
      const defaults = generateDomainTailoredTestCases(activeProject);
      setTestCases(defaults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestCases();
  }, [activeProjectId]);

  // Persist helper
  const persistTestCases = async (updatedList: FunctionalTestCase[]) => {
    setTestCases(updatedList);
  };

  // 2. Action: Generate Scenarios from Requirements & Flows
  const handleGenerateScenarios = async () => {
    try {
      setIsGenerating(true);
      notify(`Synthesizing functional test matrix for "${activeProject.name}"...`, "info");

      // Fetch requirements for active project
      const { data: reqData } = await supabase
        .from("requirements")
        .select("*")
        .eq("project_id", activeProjectId);

      const mappedReqs: SystemRequirement[] = (reqData || []).map((row, index) => {
        const analysisObj = (row.analysis as Record<string, unknown>) || {};
        return {
          id: row.id,
          projectId: row.project_id,
          reqCode: (analysisObj.reqCode as string) || `REQ-FUNC-${String(index + 1).padStart(3, "0")}`,
          title: row.title,
          description: row.raw_text,
          category: (analysisObj.category as SystemRequirement["category"]) || "Functional",
          status: "Approved",
          priority: "High",
          verificationStatus: "Verified",
          acceptanceCriteria: (analysisObj.acceptanceCriteria as string[]) || [],
          traceability: {
            sourceFeature: row.title,
            businessFlow: "Core Workflow",
            testCasesCount: 1,
            defectsCount: 0,
          },
        };
      });

      // Fetch business flows if available
      let flows: BusinessFlow[] = [];
      try {
        const { data: flowData } = await supabase
          .from("business_flows")
          .select("*")
          .eq("project_id", activeProjectId);
        if (flowData && flowData.length > 0) {
          flows = flowData.map((f) => ({
            id: f.id,
            projectId: f.project_id,
            flowCode: f.flow_code,
            title: f.title,
            description: f.description || "",
            category: f.category as BusinessFlow["category"],
            status: f.status,
            verificationStatus: "Verified",
            startPoint: f.start_point,
            endPoint: f.end_point,
            steps: Array.isArray(f.steps) ? (f.steps as unknown as BusinessFlow["steps"]) : [],
            validation: f.validation as unknown as BusinessFlow["validation"],
            traceability: f.traceability as unknown as BusinessFlow["traceability"],
          }));
        }
      } catch {}

      if (flows.length === 0 && typeof window !== "undefined") {
        try {
          const local = localStorage.getItem(`qa_hub_flows_${activeProjectId}`);
          if (local) flows = JSON.parse(local);
        } catch {}
      }

      // Generate test cases (strictly defaults to executionStatus = "Not Run")
      const generated = generateTestCasesFromRequirementsAndFlows(
        mappedReqs,
        flows,
        activeProject
      );

      // Insert into Supabase test_cases table
      let insertedCount = 0;
      for (const tc of generated) {
        try {
          const { data, error } = await supabase
            .from("test_cases")
            .insert({
              project_id: activeProjectId,
              requirement_id: tc.requirementId ? tc.requirementId : undefined,
              title: tc.title,
              description: `Module: ${tc.module} | Variation: ${tc.categoryVariation}`,
              type: tc.type,
              priority: tc.priority,
              steps: {
                scenarioId: tc.scenarioId,
                testCaseId: tc.testCaseId,
                module: tc.module,
                categoryVariation: tc.categoryVariation,
                preconditions: tc.preconditions,
                executionSteps: tc.steps,
                executionStatus: "Not Run", // STRICT DEFAULT
                verificationStatus: tc.verificationStatus,
              } as unknown as Json,
              expected_result: tc.expectedResult,
              status: "draft",
            })
            .select("id")
            .single();

          if (!error && data?.id) {
            tc.id = data.id;
            insertedCount++;
          }
        } catch (dbErr) {
          console.warn("Supabase test_cases insert skipped:", dbErr);
        }
      }

      setTestCases((prev) => [...generated, ...prev]);
      notify(
        `Generated ${generated.length} test cases (Execution Status strictly initialized to "Not Run"). Saved ${insertedCount} to Supabase.`,
        "success"
      );
    } catch (err) {
      console.error("Failed to generate test cases:", err);
      notify("Failed to generate test cases.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Action: Generate Positive / Negative / Edge Variations
  const handleGenerateVariations = (baseTc: FunctionalTestCase) => {
    const variations = generateVariationsForTestCase(baseTc);
    // Replace base or append new variations
    const updated = [
      ...variations,
      ...testCases.filter((t) => t.testCaseId !== baseTc.testCaseId),
    ];
    persistTestCases(updated);
    notify(
      `Synthesized 3 execution variations for ${baseTc.testCaseId}: Positive, Negative, and Edge Case (all initialized as "Not Run").`,
      "success"
    );
  };

  // 4. Action: Approve Test Case
  const handleApproveTestCase = async (id: string) => {
    const target = testCases.find((t) => t.id === id);
    if (!target) return;

    const updated = testCases.map((t) =>
      t.id === id ? { ...t, approvalStatus: "approved" as const } : t
    );
    persistTestCases(updated);
    notify(`Test Case "${target.testCaseId}" approved for regression suite.`, "success");

    try {
      await supabase
        .from("test_cases")
        .update({ status: "active" })
        .eq("id", id);
    } catch {}
  };

  // 5. Action: Reject Test Case
  const handleRejectTestCase = async (id: string) => {
    const target = testCases.find((t) => t.id === id);
    if (!target) return;

    const updated = testCases.map((t) =>
      t.id === id ? { ...t, approvalStatus: "rejected" as const } : t
    );
    persistTestCases(updated);
    notify(`Test Case "${target.testCaseId}" marked as Rejected.`, "info");
  };

  // 6. Action: Execute Test Case Simulation
  const handleExecuteTestCase = async (tc: FunctionalTestCase) => {
    setActiveConsoleTc(tc);
    setConsoleLogs([]);
    setConsoleRunning(true);
    setExecutingTcId(tc.id);

    // Update status to "Running"
    setTestCases((prev) =>
      prev.map((t) =>
        t.id === tc.id ? { ...t, executionStatus: "Running" as TestExecutionStatus } : t
      )
    );

    try {
      const result = await executeTestCaseSimulation(tc, (stepNum, log) => {
        setConsoleLogs((prev) => [...prev, log]);
      });

      setConsoleLogs(result.logs);
      setConsoleRunning(false);

      const finalStatus: TestExecutionStatus = result.status;

      // Update state with execution results
      setTestCases((prev) =>
        prev.map((t) =>
          t.id === tc.id
            ? {
                ...t,
                executionStatus: finalStatus,
                executionDurationMs: result.durationMs,
                executionLogs: result.logs,
                steps: result.executedSteps,
                executedAt: new Date().toISOString(),
              }
            : t
        )
      );

      notify(
        `Test Case ${tc.testCaseId} executed: ${finalStatus} in ${result.durationMs}ms.`,
        "success"
      );

      // Persist to Supabase
      try {
        await supabase
          .from("test_cases")
          .update({
            status: finalStatus === "Passed" ? "passed" : "failed",
          })
          .eq("id", tc.id);
      } catch {}
    } catch (err) {
      console.error("Execution error:", err);
      setConsoleRunning(false);
      setTestCases((prev) =>
        prev.map((t) =>
          t.id === tc.id ? { ...t, executionStatus: "Failed" as TestExecutionStatus } : t
        )
      );
    } finally {
      setExecutingTcId(null);
    }
  };

  // Filter Logic
  const filteredTestCases = useMemo(() => {
    return testCases.filter((tc) => {
      if (selectedModule !== "All" && tc.module !== selectedModule) return false;
      if (selectedPriority !== "All" && tc.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false;
      if (selectedExecutionStatus !== "All" && tc.executionStatus !== selectedExecutionStatus) return false;
      if (selectedVariation !== "All" && tc.categoryVariation !== selectedVariation) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = tc.testCaseId.toLowerCase().includes(q) || tc.scenarioId.toLowerCase().includes(q);
        const matchesTitle = tc.title.toLowerCase().includes(q);
        const matchesExpected = tc.expectedResult.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesExpected) return false;
      }
      return true;
    });
  }, [testCases, selectedModule, selectedPriority, selectedExecutionStatus, selectedVariation, searchQuery]);

  // Unique Modules for filter
  const uniqueModules = useMemo(() => {
    const set = new Set<string>();
    testCases.forEach((t) => {
      if (t.module) set.add(t.module);
    });
    return Array.from(set);
  }, [testCases]);

  // Matrix KPI Metrics
  const metrics = useMemo(() => {
    const total = testCases.length;
    const notRun = testCases.filter((t) => t.executionStatus === "Not Run").length;
    const passed = testCases.filter((t) => t.executionStatus === "Passed").length;
    const failed = testCases.filter((t) => t.executionStatus === "Failed").length;
    const critical = testCases.filter((t) => t.priority === "critical").length;
    const passRate = total > 0 && (passed + failed > 0) ? Math.round((passed / (passed + failed)) * 100) : 0;

    return { total, notRun, passed, failed, critical, passRate };
  }, [testCases]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadge = (priority: TestCasePriority) => {
    switch (priority) {
      case "critical":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">Critical</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-orange-500 text-white uppercase tracking-wider">High</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-700">Low</span>;
    }
  };

  const getExecutionBadge = (status: TestExecutionStatus) => {
    switch (status) {
      case "Passed":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Passed</span>;
      case "Failed":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-rose-600" /> Failed</span>;
      case "Running":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-300 flex items-center gap-1 animate-pulse"><Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600" /> Running...</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-500" /> Not Run</span>;
    }
  };

  const getVariationBadge = (variation: TestCategoryVariation) => {
    switch (variation) {
      case "Positive":
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800">Positive (Happy Path)</span>;
      case "Negative":
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-rose-100 text-rose-800">Negative (Exception)</span>;
      case "Edge Case":
        return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-purple-100 text-purple-800">Edge Case (Boundary)</span>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeModule="functional-qa"
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        {statusNotification && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b animate-in fade-in slide-in-from-top-1 duration-200 ${
              statusNotification.type === "success"
                ? "bg-slate-900 text-emerald-400 border-slate-800"
                : statusNotification.type === "error"
                ? "bg-rose-950 text-rose-300 border-rose-900"
                : "bg-blue-950 text-cyan-300 border-blue-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{statusNotification.message}</span>
            </div>
            <button onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm uppercase">
                  QA Test Matrix & Execution Engine
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Active Project:
                  <span className="font-semibold text-slate-800">{activeProject.name}</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Functional QA Scenarios & Test Matrix
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Comprehensive test matrix with strict "Not Run" initial state, multi-branch variations, and live runner execution.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleGenerateScenarios}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Generate Scenarios from Requirements & Flows</span>
              </button>
            </div>
          </div>

          {/* KPI Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Test Cases</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">Matrix</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Not Run (Pending)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-700">{metrics.notRun}</span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">Default</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Passed</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">{metrics.passed}</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">Verified</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Failed</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${metrics.failed > 0 ? "text-rose-600" : "text-slate-800"}`}>{metrics.failed}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${metrics.failed > 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                  {metrics.failed === 0 ? "Zero" : "Defect"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Pass Rate</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-indigo-600">{metrics.passRate}%</span>
                <span className="text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">Executed</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Critical Priority</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-red-600">{metrics.critical}</span>
                <span className="text-[11px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-sm">High Risk</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search test case ID, scenario, title, expected result..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600">×</button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Module Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Module:</span>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Modules</option>
                    {uniqueModules.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Execution Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <select
                    value={selectedExecutionStatus}
                    onChange={(e) => setSelectedExecutionStatus(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Not Run">Not Run</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Priority:</span>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Variation Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Variation:</span>
                  <select
                    value={selectedVariation}
                    onChange={(e) => setSelectedVariation(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Variations</option>
                    <option value="Positive">Positive (Happy Path)</option>
                    <option value="Negative">Negative (Exception)</option>
                    <option value="Edge Case">Edge Case (Boundary)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {!loading && filteredTestCases.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
                <ClipboardCheck className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Test Cases Match Criteria</h3>
              <p className="text-sm text-slate-600 max-w-md mt-1 mb-5">
                Generate a comprehensive test matrix directly from active requirements and business flows.
              </p>
              <button
                onClick={handleGenerateScenarios}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Generate Test Scenarios Now</span>
              </button>
            </div>
          )}

          {/* Test Matrix List */}
          {!loading && filteredTestCases.length > 0 && (
            <div className="space-y-4">
              {filteredTestCases.map((tc) => {
                const isExpanded = !!expandedCards[tc.id];

                return (
                  <div
                    key={tc.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all"
                  >
                    {/* Header: IDs, Title, Badges, Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Scenario & Test Case ID Badges */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white shadow-2xs">
                            {tc.testCaseId}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 text-center bg-slate-100 rounded-xs">
                            {tc.scenarioId}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                            {tc.title}
                          </h2>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {tc.module}
                            </span>
                            {getVariationBadge(tc.categoryVariation)}
                            {getPriorityBadge(tc.priority)}
                            <span className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Verified Evidence
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Execution Status Badge & Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-start shrink-0 flex-wrap">
                        {getExecutionBadge(tc.executionStatus)}

                        {/* Execute Button */}
                        <button
                          onClick={() => handleExecuteTestCase(tc)}
                          disabled={executingTcId === tc.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Execute test case simulation with Playwright assertions"
                        >
                          {executingTcId === tc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          <span>Execute</span>
                        </button>

                        {/* Generate Positive/Negative/Edge Button */}
                        <button
                          onClick={() => handleGenerateVariations(tc)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-all cursor-pointer"
                          title="Generate Positive, Negative, and Edge Case test variations"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>Generate Variations</span>
                        </button>

                        {/* Approve Button */}
                        <button
                          onClick={() => handleApproveTestCase(tc.id)}
                          disabled={tc.approvalStatus === "approved"}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            tc.approvalStatus === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Approve for Regression Suite"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </button>

                        {/* Reject Button */}
                        <button
                          onClick={() => handleRejectTestCase(tc.id)}
                          disabled={tc.approvalStatus === "rejected"}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            tc.approvalStatus === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200 opacity-60"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Reject Test Case"
                        >
                          <XCircle className="h-4 w-4 text-rose-600" />
                        </button>
                      </div>
                    </div>

                    {/* Preconditions & Expected Result */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                          Preconditions:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          {tc.preconditions.map((p, pIdx) => (
                            <li key={pIdx}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/60">
                        <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block mb-1">
                          Expected Result:
                        </span>
                        <p className="text-slate-800 leading-relaxed font-medium">{tc.expectedResult}</p>
                      </div>
                    </div>

                    {/* Steps Accordion */}
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <div
                        onClick={() => toggleExpand(tc.id)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                          Test Execution Steps ({tc.steps.length})
                        </span>
                        <button className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                          <span>{isExpanded ? "Collapse" : "Expand"}</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-slate-200">
                          {tc.steps.map((st) => (
                            <div
                              key={st.stepNumber}
                              className="flex items-start gap-2.5 bg-white p-2.5 rounded-md border border-slate-200 text-xs text-slate-800"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-mono text-[10px] font-bold text-indigo-700">
                                {st.stepNumber}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-slate-900 block">{st.action}</span>
                                <span className="text-slate-500 block text-[11px] mt-0.5">
                                  Expected: {st.expectedResult}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs font-bold ${
                                  st.status === "Passed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {st.status || "Not Run"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Traceability Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        {tc.requirementCode && (
                          <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-sm border border-blue-100">
                            Req: {tc.requirementCode}
                          </span>
                        )}
                        {tc.flowCode && (
                          <span className="font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded-sm border border-purple-100">
                            Flow: {tc.flowCode}
                          </span>
                        )}
                        {tc.executionDurationMs && (
                          <span className="text-slate-600">Duration: {tc.executionDurationMs}ms</span>
                        )}
                      </div>
                      <span className="text-slate-400">Status: {tc.approvalStatus.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* LIVE EXECUTION CONSOLE MODAL */}
      {activeConsoleTc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0B132B] text-slate-200 p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Playwright Runner: {activeConsoleTc.testCaseId}
                </h3>
              </div>
              <button
                onClick={() => setActiveConsoleTc(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-2 text-xs text-slate-400 flex items-center justify-between border-b border-slate-800/60">
              <span>Target: {activeConsoleTc.title}</span>
              {consoleRunning ? (
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Loader2 className="h-3 w-3 animate-spin" /> RUNNING
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> COMPLETED
                </span>
              )}
            </div>

            {/* Console Output Log Viewport */}
            <div className="mt-3 flex-1 overflow-y-auto bg-slate-950/90 rounded-lg p-3 font-mono text-[11px] leading-relaxed space-y-1 border border-slate-800 text-slate-300">
              {consoleLogs.map((log, lIdx) => (
                <div
                  key={lIdx}
                  className={
                    log.includes("PASSED")
                      ? "text-emerald-400 font-bold"
                      : log.includes("ASSERTION")
                      ? "text-cyan-300"
                      : "text-slate-300"
                  }
                >
                  {log}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveConsoleTc(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Close Runner Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
