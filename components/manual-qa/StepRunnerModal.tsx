"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Bug,
  Plus,
  Paperclip,
  Terminal,
  FileText,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  TestExecutionResult,
  TestStepExecution,
  TestResultStatus,
  StepExecutionStatus,
  EvidenceAttachment,
} from "@/types/manual-qa";

interface StepRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestExecutionResult | null;
  onSaveResult: (updatedResult: TestExecutionResult) => void;
  onFileBugFromTest: (result: TestExecutionResult, failedStep?: TestStepExecution) => void;
}

export function StepRunnerModal({
  isOpen,
  onClose,
  result,
  onSaveResult,
  onFileBugFromTest,
}: StepRunnerModalProps) {
  const [steps, setSteps] = useState<TestStepExecution[]>([]);
  const [overallStatus, setOverallStatus] = useState<TestResultStatus>("not_run");
  const [notes, setNotes] = useState<string>("");
  const [evidenceList, setEvidenceList] = useState<EvidenceAttachment[]>([]);
  const [newEvidenceTitle, setNewEvidenceTitle] = useState("");
  const [newEvidenceContent, setNewEvidenceContent] = useState("");
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (result) {
      setSteps(
        result.stepsExecution.map((s) => ({
          ...s,
        }))
      );
      setOverallStatus(result.status || "not_run");
      setNotes(result.notes || "");
      setEvidenceList(result.evidenceUrls || []);
      setElapsedSeconds(Math.floor((result.executionTimeMs || 0) / 1000));
      setIsTimerRunning(true);
    }
  }, [result]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  if (!isOpen || !result) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStepStatusChange = (stepIdx: number, newStatus: StepExecutionStatus) => {
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      status: newStatus,
    };
    setSteps(updated);

    // Auto compute recommended overall status
    if (updated.some((s) => s.status === "failed")) {
      setOverallStatus("failed");
    } else if (updated.some((s) => s.status === "blocked")) {
      setOverallStatus("blocked");
    } else if (updated.every((s) => s.status === "passed")) {
      setOverallStatus("passed");
    }
  };

  const handleStepActualResultChange = (stepIdx: number, actual: string) => {
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      actualResult: actual,
    };
    setSteps(updated);
  };

  const handleAddEvidence = () => {
    if (!newEvidenceTitle.trim() || !newEvidenceContent.trim()) return;
    const item: EvidenceAttachment = {
      id: `ev_${Date.now()}`,
      type: newEvidenceContent.startsWith("http") ? "link" : "log",
      title: newEvidenceTitle.trim(),
      urlOrContent: newEvidenceContent.trim(),
      addedAt: new Date().toISOString(),
    };
    setEvidenceList([...evidenceList, item]);
    setNewEvidenceTitle("");
    setNewEvidenceContent("");
    setIsAddingEvidence(false);
  };

  const handleSave = () => {
    const updated: TestExecutionResult = {
      ...result,
      status: overallStatus,
      stepsExecution: steps,
      notes: notes.trim() || undefined,
      evidenceUrls: evidenceList,
      executionTimeMs: elapsedSeconds * 1000,
      executedBy: "Shawon Ahmed",
      executedAt: new Date().toISOString(),
    };
    onSaveResult(updated);
    onClose();
  };

  const firstFailedStep = steps.find((s) => s.status === "failed");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden my-8">
        {/* Navy Header */}
        <div className="bg-[#0B132B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-cyan-400 border border-cyan-500/30">
              <Play className="h-4 w-4 fill-cyan-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  {result.testCaseCode}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-300">
                  {result.module || "Manual QA Execution"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 line-clamp-1">
                {result.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(elapsedSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
              >
                {isTimerRunning ? "Pause" : "Resume"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          {/* Preconditions */}
          {result.preconditions && result.preconditions.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Preconditions & Prerequisites
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                {result.preconditions.map((pre, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>{pre}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step-by-Step Execution Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Step-by-Step Test Procedure ({steps.length} Steps)
              </h3>
              <span className="text-xs text-slate-500">
                Toggle status for each step to record audit trace
              </span>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    step.status === "passed"
                      ? "bg-emerald-50/30 border-emerald-200/80"
                      : step.status === "failed"
                      ? "bg-rose-50/40 border-rose-300"
                      : step.status === "blocked"
                      ? "bg-amber-50/40 border-amber-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          Step {step.stepNumber || idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-slate-900">
                          {step.action}
                        </p>
                      </div>

                      <div className="text-xs text-slate-600 pl-8">
                        <span className="font-semibold text-slate-700">Expected:</span>{" "}
                        {step.expectedResult}
                      </div>

                      {/* Actual Result Input */}
                      <div className="pl-8 pt-1">
                        <input
                          type="text"
                          value={step.actualResult || ""}
                          onChange={(e) => handleStepActualResultChange(idx, e.target.value)}
                          placeholder="Record actual observation / output (optional for pass)..."
                          className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Step Status Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start">
                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, "passed")}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          step.status === "passed"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, "failed")}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          step.status === "failed"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Fail
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, "blocked")}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          step.status === "blocked"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        <AlertOctagon className="h-3.5 w-3.5" /> Blocked
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, "not_run")}
                        className={`px-2 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer ${
                          step.status === "not_run" ? "font-bold text-slate-700" : ""
                        }`}
                        title="Reset step to Not Run"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Execution Status & Evidence Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
            {/* Left: Overall Status & Notes */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Overall Test Case Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["passed", "failed", "blocked", "not_run"] as TestResultStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOverallStatus(st)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold text-center capitalize transition-all cursor-pointer border ${
                          overallStatus === st
                            ? st === "passed"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : st === "failed"
                              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                              : st === "blocked"
                              ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                              : "bg-slate-700 text-white border-slate-700 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Tester Notes & Observations
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional context, environment variables, build numbers, or workarounds..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Right: Evidence & Bug Trigger */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Evidence & Logs ({evidenceList.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingEvidence(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Attach Log / URL
                </button>
              </div>

              {/* Evidence List */}
              <div className="space-y-2 min-h-[90px] max-h-[140px] overflow-y-auto">
                {evidenceList.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No evidence attached yet. Add screenshots, console errors, or network logs.
                  </div>
                ) : (
                  evidenceList.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {ev.type === "link" ? (
                          <Paperclip className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <Terminal className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 truncate">
                          {ev.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(ev.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add Evidence Mini Form */}
              {isAddingEvidence && (
                <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={newEvidenceTitle}
                    onChange={(e) => setNewEvidenceTitle(e.target.value)}
                    placeholder="Evidence title (e.g. Console Exception)"
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <textarea
                    value={newEvidenceContent}
                    onChange={(e) => setNewEvidenceContent(e.target.value)}
                    rows={2}
                    placeholder="Paste log output, stack trace, or screenshot URL..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvidence(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddEvidence}
                      className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                    >
                      Add Evidence
                    </button>
                  </div>
                </div>
              )}

              {/* File Bug Trigger if Failure Detected */}
              {(overallStatus === "failed" || overallStatus === "blocked") && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Bug className="h-4 w-4 text-rose-600" />
                      Test Failed / Blocked
                    </h5>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      File a defect with prefilled steps & logs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFileBugFromTest(result, firstFailedStep);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    Report Bug
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tester: <span className="font-semibold text-slate-800">Shawon Ahmed</span> • Run history is automatically preserved.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" /> Save Execution Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
