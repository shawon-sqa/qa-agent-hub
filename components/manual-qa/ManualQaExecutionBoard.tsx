"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Layers,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Bug,
  ChevronDown,
  History,
  Check,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  TestRun,
  TestExecutionResult,
  TestResultStatus,
  TestStepExecution,
} from "@/types/manual-qa";
import { FunctionalTestCase } from "@/types/functional-qa";
import {
  fetchProjectTestRuns,
  createNewTestRun,
  saveTestExecutionResult,
  buildInitialManualTestCases,
} from "@/lib/manual-qa/manualQaService";
import { StepRunnerModal } from "./StepRunnerModal";
import { TestRunModal } from "./TestRunModal";
import { BugReportModal } from "@/components/defect-management/BugReportModal";
import { createBugReport } from "@/lib/defect-management/defectService";
import { BugReport } from "@/types/defect-management";

export function ManualQaExecutionBoard() {
  const { activeProjectId, activeProject } = useActiveProject();

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string>("");
  const [runResultsMap, setRunResultsMap] = useState<Record<string, TestExecutionResult[]>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuite, setSelectedSuite] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");

  // Modals
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [activeRunnerResult, setActiveRunnerResult] = useState<TestExecutionResult | null>(null);
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugPrefillData, setBugPrefillData] = useState<{
    testCaseId?: string | null;
    testCaseCode?: string;
    runId?: string | null;
    testResultId?: string | null;
    title?: string;
    expectedResult?: string;
    actualResult?: string;
    steps?: { stepNumber: number; action: string }[];
    evidence?: { title: string; urlOrContent: string }[];
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const notify = (message: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Initial Load
  const loadData = async () => {
    try {
      setLoading(true);
      const testCases = buildInitialManualTestCases(activeProject);
      const { runs: fetchedRuns, activeRunResults } = await fetchProjectTestRuns(
        activeProject,
        testCases
      );

      setRuns(fetchedRuns);
      setRunResultsMap(activeRunResults);

      if (fetchedRuns.length > 0) {
        setActiveRunId(fetchedRuns[0].id);
      }
    } catch (err) {
      console.error("Error loading manual QA data:", err);
      notify("Failed to load test runs. Using offline state.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProjectId]);

  const activeRun = useMemo(() => {
    return runs.find((r) => r.id === activeRunId) || runs[0] || null;
  }, [runs, activeRunId]);

  const currentResults = useMemo(() => {
    if (!activeRun) return [];
    return runResultsMap[activeRun.id] || [];
  }, [activeRun, runResultsMap]);

  // Available Suites extracted from current results
  const availableSuites = useMemo(() => {
    const set = new Set<string>();
    currentResults.forEach((r) => {
      if (r.module) set.add(r.module);
    });
    return Array.from(set);
  }, [currentResults]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    return currentResults.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.testCaseCode.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          (r.module && r.module.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (selectedSuite !== "All" && r.module !== selectedSuite) return false;
      if (selectedStatus !== "All" && r.status !== selectedStatus.toLowerCase()) return false;
      if (selectedPriority !== "All" && r.priority !== selectedPriority.toLowerCase()) return false;
      return true;
    });
  }, [currentResults, searchQuery, selectedSuite, selectedStatus, selectedPriority]);

  // Statistics
  const stats = useMemo(() => {
    const total = currentResults.length;
    const passed = currentResults.filter((r) => r.status === "passed").length;
    const failed = currentResults.filter((r) => r.status === "failed").length;
    const blocked = currentResults.filter((r) => r.status === "blocked").length;
    const notRun = currentResults.filter((r) => r.status === "not_run").length;
    const executed = total - notRun;
    const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;
    return { total, passed, failed, blocked, notRun, passRate };
  }, [currentResults]);

  // Handlers
  const handleOpenRunner = (result: TestExecutionResult) => {
    setActiveRunnerResult(result);
    setIsRunnerOpen(true);
  };

  const handleSaveResult = async (updatedResult: TestExecutionResult) => {
    if (!activeRun) return;

    // Optimistic state update
    const updatedList = currentResults.map((r) =>
      r.id === updatedResult.id ? updatedResult : r
    );
    setRunResultsMap((prev) => ({
      ...prev,
      [activeRun.id]: updatedList,
    }));

    const updatedRun = await saveTestExecutionResult(activeRun, updatedResult, currentResults);
    setRuns((prev) => prev.map((r) => (r.id === updatedRun.id ? updatedRun : r)));

    notify(`Result recorded for ${updatedResult.testCaseCode} (${updatedResult.status})`, "success");
  };

  const handleQuickStatusChange = async (result: TestExecutionResult, newStatus: TestResultStatus) => {
    if (!activeRun) return;

    const updatedSteps = result.stepsExecution.map((s) => ({
      ...s,
      status: newStatus === "passed" ? ("passed" as const) : newStatus === "failed" ? ("failed" as const) : newStatus === "blocked" ? ("blocked" as const) : ("not_run" as const),
    }));

    const updatedResult: TestExecutionResult = {
      ...result,
      status: newStatus,
      stepsExecution: updatedSteps,
      executionTimeMs: result.executionTimeMs || 25000,
      executedBy: "Shawon Ahmed",
      executedAt: new Date().toISOString(),
    };

    await handleSaveResult(updatedResult);
  };

  const handleCreateRun = async (data: {
    name: string;
    suiteName: string;
    environment: string;
    testerName: string;
    notes?: string;
  }) => {
    try {
      const testCases = buildInitialManualTestCases(activeProject);
      const { run, results } = await createNewTestRun(
        activeProject,
        data.name,
        data.suiteName,
        data.environment,
        data.testerName,
        testCases
      );

      setRuns([run, ...runs]);
      setRunResultsMap((prev) => ({
        ...prev,
        [run.id]: results,
      }));
      setActiveRunId(run.id);

      notify(`Test Run "${run.name}" created with ${results.length} tests ready for execution.`, "success");
    } catch (err) {
      console.error("Error creating test run:", err);
      notify("Failed to initialize test run.", "error");
    }
  };

  const handleFileBugFromTest = (
    result: TestExecutionResult,
    failedStep?: TestStepExecution
  ) => {
    setBugPrefillData({
      testCaseId: result.testCaseId,
      testCaseCode: result.testCaseCode,
      runId: result.runId,
      testResultId: result.id,
      title: result.title,
      expectedResult: failedStep?.expectedResult || result.stepsExecution[0]?.expectedResult,
      actualResult:
        failedStep?.actualResult ||
        result.notes ||
        "Observed execution failure during manual step procedure.",
      steps: result.stepsExecution.map((s) => ({
        stepNumber: s.stepNumber,
        action: s.action,
      })),
      evidence: result.evidenceUrls.map((ev) => ({
        title: ev.title,
        urlOrContent: ev.urlOrContent,
      })),
    });
    setIsBugModalOpen(true);
  };

  const handleSaveBug = async (
    data: Omit<BugReport, "id" | "projectId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const newBug = await createBugReport(activeProject, data);
      notify(`Defect filed successfully: "${newBug.title}" (Status: ${newBug.status.toUpperCase()})`, "success");
    } catch (err) {
      console.error("Error filing bug:", err);
      notify("Failed to save defect.", "error");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold text-white flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === "success"
              ? "bg-slate-900 border border-emerald-500/40"
              : notification.type === "error"
              ? "bg-rose-900 border border-rose-500"
              : "bg-blue-900 border border-blue-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              notification.type === "success"
                ? "bg-emerald-400"
                : notification.type === "error"
                ? "bg-rose-400"
                : "bg-cyan-400"
            }`}
          />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                Manual QA Execution
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Project: {activeProject.name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Target: https://{activeProject.domain}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Interactive Test Execution Board
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Execute test suites step-by-step, record audit traces with evidence and duration,
              and link defects directly into Defect Management without losing historical run records.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <History className="h-4 w-4 text-slate-500" />
              Run History ({runs.length})
            </button>
            <button
              onClick={() => setIsNewRunModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Start New Test Run
            </button>
          </div>
        </div>
      </div>

      {/* Active Run Selector & Summary Bar */}
      {activeRun && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Play className="h-5 w-5 fill-current" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {activeRun.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeRun.status === "completed"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  {activeRun.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Suite: <span className="font-semibold text-slate-700">{activeRun.suiteName}</span> • Env: <span className="font-semibold text-slate-700">{activeRun.environment}</span> • Tester: <span className="font-semibold text-slate-700">{activeRun.testerName}</span>
              </p>
            </div>
          </div>

          {/* Switch Run Dropdown */}
          {runs.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">Switch Run:</span>
              <select
                value={activeRunId}
                onChange={(e) => setActiveRunId(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.passedCount}/{r.totalTests} Passed)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tests</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-400">Assigned in Run</span>
        </div>

        {/* Passed */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Passed
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.passed}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Verified Clean</span>
        </div>

        {/* Failed */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> Failed
          </span>
          <div className="text-2xl font-black text-rose-800 mt-1">{stats.failed}</div>
          <span className="text-[11px] text-rose-600 font-medium">Requires Bug Triage</span>
        </div>

        {/* Blocked */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertOctagon className="h-3.5 w-3.5" /> Blocked
          </span>
          <div className="text-2xl font-black text-amber-800 mt-1">{stats.blocked}</div>
          <span className="text-[11px] text-amber-600 font-medium">Dep Inaccessible</span>
        </div>

        {/* Not Run */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Not Run
          </span>
          <div className="text-2xl font-black text-slate-800 mt-1">{stats.notRun}</div>
          <span className="text-[11px] text-slate-400">Awaiting Execution</span>
        </div>

        {/* Pass Rate */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Pass Rate</span>
          <div className="text-2xl font-black text-blue-900 mt-1">{stats.passRate}%</div>
          <span className="text-[11px] text-blue-600 font-medium">Of Executed Tests</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by test ID, title, or module..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Suite Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none"
            >
              <option value="All">All Suites</option>
              {availableSuites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {(["All", "Not Run", "Passed", "Failed", "Blocked"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === st
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "hover:text-slate-900 text-slate-600"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Test Matrix Cards Table */}
      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
            <SlidersHorizontal className="h-8 w-8 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No test cases match filter criteria</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search query, test suite, or status filters.
            </p>
          </div>
        ) : (
          filteredResults.map((result) => {
            const hasFailed = result.status === "failed";
            const isBlocked = result.status === "blocked";
            const isPassed = result.status === "passed";

            return (
              <div
                key={result.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all bg-white hover:shadow-xs ${
                  isPassed
                    ? "border-emerald-200/90"
                    : hasFailed
                    ? "border-rose-300/90 bg-rose-50/10"
                    : isBlocked
                    ? "border-amber-300/90 bg-amber-50/10"
                    : "border-slate-200/80"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Metadata & Title */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(result.testCaseCode, result.id)}
                        className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click to copy test ID"
                      >
                        {result.testCaseCode}
                        {copiedId === result.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-400" />
                        )}
                      </button>

                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {result.module || "Functional"}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          result.priority === "critical"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : result.priority === "high"
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {result.priority || "medium"}
                      </span>

                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {result.stepsExecution.length} Steps
                      </span>

                      {result.executionTimeMs > 0 && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(result.executionTimeMs / 1000)}s
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {result.title}
                    </h3>

                    {/* Step Status Badges Preview */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">Steps:</span>
                      {result.stepsExecution.map((step, sIdx) => (
                        <span
                          key={sIdx}
                          title={`Step ${step.stepNumber}: ${step.action} (${step.status})`}
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                            step.status === "passed"
                              ? "bg-emerald-500"
                              : step.status === "failed"
                              ? "bg-rose-500"
                              : step.status === "blocked"
                              ? "bg-amber-500"
                              : "bg-slate-300 text-slate-700"
                          }`}
                        >
                          {step.stepNumber}
                        </span>
                      ))}
                    </div>

                    {result.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700">Tester Note:</span>{" "}
                        {result.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Status Badge & Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
                    {/* Overall Status Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                        isPassed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : hasFailed
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : isBlocked
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : hasFailed ? (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      ) : isBlocked ? (
                        <AlertOctagon className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                      <span>{result.status.replace("_", " ")}</span>
                    </div>

                    {/* Step-by-Step Runner Trigger */}
                    <button
                      onClick={() => handleOpenRunner(result)}
                      className="px-3.5 py-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
                      Execute Steps
                    </button>

                    {/* Quick Pass */}
                    <button
                      onClick={() => handleQuickStatusChange(result, "passed")}
                      className="p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                      title="Quick mark as Passed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    {/* Quick Fail */}
                    <button
                      onClick={() => handleQuickStatusChange(result, "failed")}
                      className="p-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors"
                      title="Quick mark as Failed"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>

                    {/* Quick Report Bug */}
                    {(hasFailed || isBlocked) && (
                      <button
                        onClick={() => handleFileBugFromTest(result)}
                        className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        title="File Bug into Defect Management"
                      >
                        <Bug className="h-3.5 w-3.5" />
                        Report Bug
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden my-8">
            <div className="bg-[#0B132B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-cyan-400">
                  <History className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Preserved Run History ({runs.length} Runs)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Historical executions are archived without overwriting prior audits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {runs.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    r.id === activeRunId
                      ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{r.name}</span>
                        {r.id === activeRunId && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(r.startedAt).toLocaleDateString()} • Suite: {r.suiteName} • Tester: {r.testerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <span className="font-bold text-emerald-600">{r.passedCount} Passed</span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-bold text-rose-600">{r.failedCount} Failed</span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveRunId(r.id);
                          setShowHistoryModal(false);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Load Run
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <StepRunnerModal
        isOpen={isRunnerOpen}
        onClose={() => setIsRunnerOpen(false)}
        result={activeRunnerResult}
        onSaveResult={handleSaveResult}
        onFileBugFromTest={handleFileBugFromTest}
      />

      <TestRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        projectName={activeProject.name}
        projectEnvironment={activeProject.environment || "Staging"}
        availableSuites={availableSuites}
        onCreateRun={handleCreateRun}
      />

      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => {
          setIsBugModalOpen(false);
          setBugPrefillData(null);
        }}
        prefillFromTest={bugPrefillData}
        onSaveBug={handleSaveBug}
      />
    </div>
  );
}
