"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bug,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  Paperclip,
  Save,
  Layers,
} from "lucide-react";
import {
  BugReport,
  BugSeverity,
  BugPriority,
  BugLifecycleStatus,
  BugReproductionStep,
  BugEvidence,
} from "@/types/defect-management";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBug?: BugReport | null;
  prefillFromTest?: {
    testCaseId?: string | null;
    testCaseCode?: string;
    runId?: string | null;
    testResultId?: string | null;
    title?: string;
    expectedResult?: string;
    actualResult?: string;
    steps?: { stepNumber: number; action: string }[];
    evidence?: { title: string; urlOrContent: string }[];
  } | null;
  onSaveBug: (data: Omit<BugReport, "id" | "projectId" | "createdAt" | "updatedAt">) => void;
}

export function BugReportModal({
  isOpen,
  onClose,
  editingBug,
  prefillFromTest,
  onSaveBug,
}: BugReportModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testCaseCode, setTestCaseCode] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("high");
  const [priority, setPriority] = useState<BugPriority>("high");
  const [status, setStatus] = useState<BugLifecycleStatus>("open");
  const [assignee, setAssignee] = useState("Unassigned");
  const [expectedResult, setExpectedResult] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [steps, setSteps] = useState<BugReproductionStep[]>([
    { stepNumber: 1, description: "Navigate to target page" },
  ]);
  const [evidenceList, setEvidenceList] = useState<BugEvidence[]>([]);
  const [newEvidenceTitle, setNewEvidenceTitle] = useState("");
  const [newEvidenceContent, setNewEvidenceContent] = useState("");
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  useEffect(() => {
    if (editingBug) {
      setTitle(editingBug.title);
      setDescription(editingBug.description);
      setTestCaseCode(editingBug.testCaseCode || "");
      setSeverity(editingBug.severity);
      setPriority(editingBug.priority);
      setStatus(editingBug.status);
      setAssignee(editingBug.assignee);
      setExpectedResult(editingBug.expectedResult || "");
      setActualResult(editingBug.actualResult || "");
      setSteps(editingBug.reproductionSteps.length > 0 ? editingBug.reproductionSteps : [{ stepNumber: 1, description: "" }]);
      setEvidenceList(editingBug.evidenceUrls || []);
    } else if (prefillFromTest) {
      setTitle(`[Failure] ${prefillFromTest.title || "Unexpected test failure observed"}`);
      setDescription(
        `Automated/Manual execution of ${prefillFromTest.testCaseCode || "test case"} encountered a failure condition.`
      );
      setTestCaseCode(prefillFromTest.testCaseCode || "");
      setSeverity("high");
      setPriority("high");
      setStatus("open");
      setAssignee("Backend Team");
      setExpectedResult(prefillFromTest.expectedResult || "");
      setActualResult(prefillFromTest.actualResult || "Unexpected runtime error / assertion failure.");
      if (prefillFromTest.steps && prefillFromTest.steps.length > 0) {
        setSteps(
          prefillFromTest.steps.map((s, idx) => ({
            stepNumber: idx + 1,
            description: s.action,
          }))
        );
      }
      if (prefillFromTest.evidence && prefillFromTest.evidence.length > 0) {
        setEvidenceList(
          prefillFromTest.evidence.map((ev, idx) => ({
            id: `ev_prefill_${idx}`,
            type: "log",
            title: ev.title,
            content: ev.urlOrContent,
            uploadedAt: new Date().toISOString(),
          }))
        );
      }
    } else {
      // Clean defaults
      setTitle("");
      setDescription("");
      setTestCaseCode("");
      setSeverity("medium");
      setPriority("medium");
      setStatus("open");
      setAssignee("Unassigned");
      setExpectedResult("");
      setActualResult("");
      setSteps([{ stepNumber: 1, description: "Navigate to target view" }]);
      setEvidenceList([]);
    }
  }, [editingBug, prefillFromTest, isOpen]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, description: "" }]);
  };

  const handleStepChange = (index: number, text: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], description: text };
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter((_, i) => i !== index);
    setSteps(filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  };

  const handleAddEvidence = () => {
    if (!newEvidenceTitle.trim() || !newEvidenceContent.trim()) return;
    setEvidenceList([
      ...evidenceList,
      {
        id: `ev_${Date.now()}`,
        type: newEvidenceContent.startsWith("http") ? "url" : "log",
        title: newEvidenceTitle.trim(),
        content: newEvidenceContent.trim(),
        uploadedAt: new Date().toISOString(),
      },
    ]);
    setNewEvidenceTitle("");
    setNewEvidenceContent("");
    setIsAddingEvidence(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSaveBug({
      testCaseId: prefillFromTest?.testCaseId || editingBug?.testCaseId || null,
      testCaseCode: testCaseCode.trim() || undefined,
      runId: prefillFromTest?.runId || editingBug?.runId || null,
      testResultId: prefillFromTest?.testResultId || editingBug?.testResultId || null,
      title: title.trim(),
      description: description.trim(),
      severity,
      priority,
      status,
      reproductionSteps: steps.filter((s) => s.description.trim().length > 0),
      expectedResult: expectedResult.trim() || undefined,
      actualResult: actualResult.trim() || undefined,
      reportedBy: "Shawon Ahmed",
      assignee,
      evidenceUrls: evidenceList,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden my-8">
        {/* Navy Header */}
        <div className="bg-[#0B132B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bug className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingBug ? "Edit Defect Report" : "Create New Bug Report"}
              </h2>
              <p className="text-xs text-slate-400">
                Linked directly to verification evidence & test case audits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[74vh] overflow-y-auto space-y-5">
          {/* Linked Test Case Code Banner if present */}
          {testCaseCode && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Traceable Test Case: <strong className="text-slate-900 font-mono">{testCaseCode}</strong>
              </span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Traceability
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Defect Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unhandled 500 error when applying coupon code at checkout"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          {/* Severity, Priority, Status, Assignee */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="critical">Critical (Blocker)</option>
                <option value="high">High (Major defect)</option>
                <option value="medium">Medium (Moderate defect)</option>
                <option value="low">Low (Cosmetic/Minor)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as BugPriority)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="critical">P1 - Critical</option>
                <option value="high">P2 - High</option>
                <option value="medium">P3 - Medium</option>
                <option value="low">P4 - Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BugLifecycleStatus)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Assignee
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Backend Team">Backend Team</option>
                <option value="Frontend Team">Frontend Team</option>
                <option value="DevOps / Cloud">DevOps / Cloud</option>
                <option value="Security QA Lead">Security QA Lead</option>
                <option value="Shawon Ahmed">Shawon Ahmed</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Defect Description & Context *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the observed defect and impact on users..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Reproduction Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Steps to Reproduce
              </label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Step
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={st.description}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1} action...`}
                    className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Expected Behavior
              </label>
              <textarea
                rows={2}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="What should have happened according to specs..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Actual Behavior
              </label>
              <textarea
                rows={2}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="What actually occurred during the execution..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Evidence Attachments */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Evidence & Traceability Logs ({evidenceList.length})
              </label>
              <button
                type="button"
                onClick={() => setIsAddingEvidence(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Attach Log / Screenshot
              </button>
            </div>

            {isAddingEvidence && (
              <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
                <input
                  type="text"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  placeholder="Evidence Label (e.g. Server Stack Trace)"
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
                <textarea
                  rows={2}
                  value={newEvidenceContent}
                  onChange={(e) => setNewEvidenceContent(e.target.value)}
                  placeholder="Paste error logs, URL, or JSON payload..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingEvidence(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                  >
                    Attach
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {evidenceList.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{ev.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                    {ev.content}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" /> Save Bug Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
