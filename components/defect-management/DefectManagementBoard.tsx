"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bug,
  Plus,
  Search,
  Filter,
  Download,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Edit2,
  FileText,
  Paperclip,
  Terminal,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  BugReport,
  BugSeverity,
  BugPriority,
  BugLifecycleStatus,
} from "@/types/defect-management";
import {
  fetchProjectBugs,
  createBugReport,
  updateBugStatus,
  exportBugsToFile,
} from "@/lib/defect-management/defectService";
import { BugReportModal } from "./BugReportModal";

export function DefectManagementBoard() {
  const { activeProjectId, activeProject } = useActiveProject();

  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");

  // Expanded cards
  const [expandedBugIds, setExpandedBugIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Export
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<BugReport | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const notify = (message: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch bugs
  const loadBugs = async () => {
    try {
      setLoading(true);
      const fetched = await fetchProjectBugs(activeProject);
      setBugs(fetched);
    } catch (err) {
      console.error("Error loading bugs:", err);
      notify("Failed to load bugs from database. Using offline cache.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, [activeProjectId]);

  // Statistics
  const stats = useMemo(() => {
    const total = bugs.length;
    const open = bugs.filter((b) => b.status === "open").length;
    const inProgress = bugs.filter((b) => b.status === "in_progress").length;
    const resolved = bugs.filter((b) => b.status === "resolved").length;
    const closed = bugs.filter((b) => b.status === "closed").length;
    const critical = bugs.filter((b) => b.severity === "critical").length;
    return { total, open, inProgress, resolved, closed, critical };
  }, [bugs]);

  // Filtered bugs
  const filteredBugs = useMemo(() => {
    return bugs.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          (b.testCaseCode && b.testCaseCode.toLowerCase().includes(q)) ||
          b.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedStatus !== "All" && b.status !== selectedStatus.toLowerCase().replace(" ", "_")) {
        return false;
      }
      if (selectedSeverity !== "All" && b.severity !== selectedSeverity.toLowerCase()) {
        return false;
      }
      if (selectedPriority !== "All" && b.priority !== selectedPriority.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [bugs, searchQuery, selectedStatus, selectedSeverity, selectedPriority]);

  // Handlers
  const handleSaveBug = async (
    data: Omit<BugReport, "id" | "projectId" | "createdAt" | "updatedAt">
  ) => {
    if (editingBug) {
      // Update
      const updatedList = bugs.map((b) =>
        b.id === editingBug.id
          ? {
              ...b,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : b
      );
      setBugs(updatedList);
      notify(`Defect updated: "${data.title}"`, "success");
      setEditingBug(null);
    } else {
      // Create new
      const newBug = await createBugReport(activeProject, data);
      setBugs([newBug, ...bugs]);
      notify(`Defect report filed: "${newBug.title}"`, "success");
    }
  };

  const handleStatusChange = async (bugId: string, newStatus: BugLifecycleStatus) => {
    const updated = bugs.map((b) =>
      b.id === bugId ? { ...b, status: newStatus, updatedAt: new Date().toISOString() } : b
    );
    setBugs(updated);
    await updateBugStatus(bugId, newStatus);
    notify(`Bug status updated to ${newStatus.toUpperCase()}`, "info");
  };

  const toggleExpand = (bugId: string) => {
    setExpandedBugIds((prev) => ({ ...prev, [bugId]: !prev[bugId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (format: "markdown" | "csv" | "json") => {
    exportBugsToFile(filteredBugs, activeProject, format);
    setIsExportMenuOpen(false);
    notify(`Exported ${filteredBugs.length} defect reports as ${format.toUpperCase()}`, "success");
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
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-rose-50/20 to-indigo-50/30 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-100/60 px-2.5 py-0.5 rounded-full border border-rose-200/50">
                Defect Management
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Project: {activeProject.name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Environment: {activeProject.environment || "Staging"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Bug Reports & Defect Traceability
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Track bug lifecycles from detection through resolution. Link defects directly to
              failed test cases and export standardized defect summaries for engineering sprints.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-500" />
                Export Defects ({filteredBugs.length})
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => handleExport("markdown")}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Markdown Report</span>
                    <span className="text-[10px] text-slate-400">.md</span>
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>CSV Spreadsheet</span>
                    <span className="text-[10px] text-slate-400">.csv</span>
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>JSON Raw Data</span>
                    <span className="text-[10px] text-slate-400">.json</span>
                  </button>
                </div>
              )}
            </div>

            {/* New Bug Report */}
            <button
              onClick={() => {
                setEditingBug(null);
                setIsBugModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New Bug Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bugs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-400">All Project Defects</span>
        </div>

        {/* Critical */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> Critical
          </span>
          <div className="text-2xl font-black text-rose-800 mt-1">{stats.critical}</div>
          <span className="text-[11px] text-rose-600 font-medium">Release Blockers</span>
        </div>

        {/* Open */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Open
          </span>
          <div className="text-2xl font-black text-amber-800 mt-1">{stats.open}</div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting Triage</span>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">In Progress</span>
          <div className="text-2xl font-black text-blue-800 mt-1">{stats.inProgress}</div>
          <span className="text-[11px] text-blue-600 font-medium">Active Investigation</span>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.resolved}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for Retest</span>
        </div>

        {/* Closed */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Closed</span>
          <div className="text-2xl font-black text-slate-700 mt-1">{stats.closed}</div>
          <span className="text-[11px] text-slate-400">Verified & Signed Off</span>
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
              placeholder="Search by defect ID, title, or test code..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
              <option value="Critical">P1 - Critical</option>
              <option value="High">P2 - High</option>
              <option value="Medium">P3 - Medium</option>
              <option value="Low">P4 - Low</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {(["All", "Open", "In Progress", "Resolved", "Closed"] as const).map((st) => (
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

      {/* Bug Cards List */}
      <div className="space-y-3">
        {filteredBugs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
            <Bug className="h-8 w-8 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No defects match filter criteria</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search terms or status filters.
            </p>
          </div>
        ) : (
          filteredBugs.map((bug) => {
            const isExpanded = expandedBugIds[bug.id] || false;
            const isCritical = bug.severity === "critical";

            return (
              <div
                key={bug.id}
                className={`rounded-3xl border transition-all bg-white overflow-hidden shadow-2xs hover:shadow-xs ${
                  isCritical ? "border-rose-300" : "border-slate-200/90"
                }`}
              >
                {/* Main Card Header Bar */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Meta & Title */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Bug ID with Copy */}
                        <button
                          onClick={() => copyToClipboard(bug.id, bug.id)}
                          className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Click to copy Defect ID"
                        >
                          BUG-{bug.id.slice(0, 8).toUpperCase()}
                          {copiedId === bug.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>

                        {/* Linked Test Case Code */}
                        {bug.testCaseCode && (
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Linked: {bug.testCaseCode}
                          </span>
                        )}

                        {/* Severity Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            bug.severity === "critical"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : bug.severity === "high"
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : bug.severity === "medium"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {bug.severity === "critical" && <Flame className="h-3 w-3" />}
                          {bug.severity}
                        </span>

                        {/* Priority Badge */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {bug.priority === "critical"
                            ? "P1"
                            : bug.priority === "high"
                            ? "P2"
                            : bug.priority === "medium"
                            ? "P3"
                            : "P4"}
                        </span>

                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          Assignee: <strong className="text-slate-700">{bug.assignee}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {bug.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {bug.description}
                      </p>
                    </div>

                    {/* Right Lifecycle Status Dropdown & Actions */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0 self-end lg:self-center">
                      {/* State Transition Select */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-400">Status:</span>
                        <select
                          value={bug.status}
                          onChange={(e) =>
                            handleStatusChange(bug.id, e.target.value as BugLifecycleStatus)
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                            bug.status === "open"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : bug.status === "in_progress"
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : bug.status === "resolved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingBug(bug);
                          setIsBugModalOpen(true);
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit Defect"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* Expand Details Toggle */}
                      <button
                        onClick={() => toggleExpand(bug.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Details" : "Reproduction & Logs"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Reproduction Steps & Evidence Details */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Reproduction Steps */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          Steps to Reproduce
                        </h4>
                        {bug.reproductionSteps.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No steps recorded.</p>
                        ) : (
                          <ol className="space-y-1.5 text-xs text-slate-700 pl-4 list-decimal">
                            {bug.reproductionSteps.map((step, sIdx) => (
                              <li key={sIdx}>
                                <span>{step.description}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>

                      {/* Expected vs Actual */}
                      <div className="space-y-2">
                        {bug.expectedResult && (
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">Expected Result:</span>{" "}
                            <span className="text-slate-600">{bug.expectedResult}</span>
                          </div>
                        )}
                        {bug.actualResult && (
                          <div className="text-xs">
                            <span className="font-bold text-rose-700">Actual Result:</span>{" "}
                            <span className="text-slate-700 bg-rose-50/60 p-2 rounded-xl block border border-rose-200/60 mt-1 font-mono text-[11px]">
                              {bug.actualResult}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evidence & Logs */}
                    {bug.evidenceUrls && bug.evidenceUrls.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                          Evidence & Attached Traces ({bug.evidenceUrls.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bug.evidenceUrls.map((ev, eIdx) => (
                            <div
                              key={eIdx}
                              className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between font-semibold text-slate-800">
                                <span>{ev.title}</span>
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {ev.type}
                                </span>
                              </div>
                              <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-xl overflow-x-auto">
                                {ev.content}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Footer Meta */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                      <div>
                        Reported by: <strong className="text-slate-700">{bug.reportedBy}</strong> • Date: {new Date(bug.createdAt).toLocaleString()}
                      </div>
                      <div>
                        Last Updated: {new Date(bug.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => {
          setIsBugModalOpen(false);
          setEditingBug(null);
        }}
        editingBug={editingBug}
        onSaveBug={handleSaveBug}
      />
    </div>
  );
}
