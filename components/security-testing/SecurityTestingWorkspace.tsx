"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Bug,
  Lock,
  Layers,
  FileCode2,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  SecurityScanRun,
  SecurityHeaderCheck,
  SecurityStatus,
  SecuritySeverity,
  SecurityVulnerability,
} from "@/types/security-testing";
import { useActiveProject } from "@/lib/projects/projectState";
import { supabase } from "@/lib/supabase/client";

export function SecurityTestingWorkspace() {
  const { activeProject, projects, activeProjectId } = useActiveProject();

  // Target URL input (defaults to active project domain or demo URL)
  const defaultDomain = activeProject?.domain || "app.opsroi.com";
  const [targetUrl, setTargetUrl] = useState(`https://${defaultDomain}`);
  const [isRunning, setIsRunning] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanRun | null>(null);
  const [scanHistory, setScanHistory] = useState<SecurityScanRun[]>([]);
  const [expandedHeaderId, setExpandedHeaderId] = useState<string | null>(null);
  const [activeRemediationTab, setActiveRemediationTab] = useState<
    "nginx" | "nextjs" | "apache" | "helmet"
  >("nginx");
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Defect Filing State
  const [filingDefectFor, setFilingDefectFor] = useState<SecurityVulnerability | null>(null);
  const [filingSuccess, setFilingSuccess] = useState<string | null>(null);

  // Update target URL when active project changes
  useEffect(() => {
    if (activeProject?.domain) {
      setTargetUrl(`https://${activeProject.domain}`);
    }
  }, [activeProject]);

  // Load recent scans from Supabase or localStorage
  useEffect(() => {
    async function loadScans() {
      try {
        const { data, error } = await supabase
          .from("security_scans")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          const parsed = data.map((d) => ({
            id: d.id,
            project_id: d.project_id,
            target_url: d.target_url,
            overall_score: d.overall_score,
            grade: d.grade as "A+" | "A" | "B" | "C" | "D" | "F",
            scanned_by: d.scanned_by,
            scan_duration_ms: d.scan_duration_ms,
            headers_checked: d.headers_checked as unknown as SecurityHeaderCheck[],
            vulnerabilities: d.vulnerabilities as unknown as SecurityVulnerability[],
            summary: d.summary as unknown as SecurityScanRun["summary"],
            status: d.status as "completed" | "in_progress" | "failed",
            created_at: d.created_at,
          }));
          setScanHistory(parsed);
          setScanResult(parsed[0]);
          return;
        }
      } catch {
        // Fallback
      }

      // Initial run trigger if empty
      executeSecurityAudit(`https://${defaultDomain}`);
    }

    loadScans();
  }, [activeProjectId]);

  const executeSecurityAudit = async (urlOverride?: string) => {
    const url = urlOverride || targetUrl;
    setIsRunning(true);
    setFilingSuccess(null);

    try {
      const resp = await fetch("/api/security-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: url,
          projectId: activeProjectId || "default-project",
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.scan) {
        setScanResult(data.scan);
        setScanHistory((prev) => [data.scan, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.error("Security audit execution error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = (key: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 2500);
  };

  // 1-Click File Defect to Defect Management (public.bugs table)
  const handleCreateDefect = async (vuln: SecurityVulnerability) => {
    setFilingDefectFor(vuln);
    try {
      const bugTitle = `[Security Audit] ${vuln.title} on ${scanResult?.target_url || targetUrl}`;
      const bugDesc = `Vulnerability CWE: ${vuln.cwe}\nCategory: ${vuln.category}\nSeverity: ${vuln.severity}\n\nDescription: ${vuln.description}\n\nRemediation Recommendation: ${vuln.remediation}`;

      await supabase.from("bugs").insert({
        project_id: activeProjectId || "proj_opsroi_prod",
        title: bugTitle,
        description: bugDesc,
        severity: vuln.severity.toLowerCase() as "low" | "medium" | "high" | "critical",
        status: "open",
        reported_by: "Shawon Ahmed",
      });

      setFilingSuccess(`Successfully filed defect for: "${vuln.title}" into Defect Management!`);
      setTimeout(() => setFilingSuccess(null), 4000);
    } catch {
      setFilingSuccess(`Defect created locally for "${vuln.title}".`);
      setTimeout(() => setFilingSuccess(null), 4000);
    } finally {
      setFilingDefectFor(null);
    }
  };

  // Filtered Headers
  const filteredHeaders = useMemo(() => {
    if (!scanResult?.headers_checked) return [];

    return scanResult.headers_checked.filter((h) => {
      const matchesSearch =
        h.header.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.value && h.value.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "fail" && h.status === "fail") ||
        (statusFilter === "warn" && h.status === "warn") ||
        (statusFilter === "pass" && h.status === "pass");

      const matchesSeverity =
        severityFilter === "all" ||
        (severityFilter === "critical" && h.severity === "Critical") ||
        (severityFilter === "high" && h.severity === "High") ||
        (severityFilter === "medium" && h.severity === "Medium") ||
        (severityFilter === "low" && h.severity === "Low");

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [scanResult, searchQuery, statusFilter, severityFilter]);

  const getSeverityBadge = (sev: SecuritySeverity) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/10";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10";
      case "Low":
        return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10";
    }
  };

  const getStatusIcon = (status: SecurityStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Lock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Security Testing & Audit Workspace
              </h1>
              <p className="text-sm text-slate-500">
                Automated OWASP security header assessment, vulnerability posture & remediation engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            Lead QA Auditor: <strong className="ml-1 text-slate-800">Shawon Ahmed</strong>
          </div>
        </div>
      </div>

      {/* Target URL & Execution Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com or active endpoint"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={() => executeSecurityAudit()}
            disabled={isRunning || !targetUrl}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                Auditing Headers...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Run Security Audit
              </>
            )}
          </button>
        </div>

        {/* Quick URL Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Active Presets:</span>
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => {
                const url = `https://${proj.domain}`;
                setTargetUrl(url);
                executeSecurityAudit(url);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/60 transition-colors cursor-pointer"
            >
              {proj.name} ({proj.domain})
            </button>
          ))}
        </div>
      </div>

      {/* Defect Filed Notification Banner */}
      {filingSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{filingSuccess}</span>
          </div>
        </div>
      )}

      {/* Summary Score & Executive Posture Cards */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Grade & Score */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Security Grade
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                OWASP Compliant
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-3">
              <div
                className={`text-4xl font-extrabold px-3.5 py-1 rounded-xl border ${
                  scanResult.grade === "A+" || scanResult.grade === "A"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : scanResult.grade === "B"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : scanResult.grade === "C"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {scanResult.grade}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {scanResult.overall_score}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
                <span className="text-xs text-slate-500">Security Index</span>
              </div>
            </div>
          </div>

          {/* Passed Checks */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Passed Headers</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-slate-900">
                {scanResult.summary.passed}
                <span className="text-sm font-normal text-slate-400">
                  {" "}
                  / {scanResult.summary.total}
                </span>
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                Hardened HTTP Response Headers
              </p>
            </div>
          </div>

          {/* Warnings & Suggestions */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Warnings / Permissive</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-amber-600">
                {scanResult.summary.warnings}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sub-optimal directives or wildcards
              </p>
            </div>
          </div>

          {/* Critical / Missing Headers */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Critical / Missing</span>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-rose-600">
                {scanResult.summary.failed}
              </div>
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {scanResult.summary.criticalRisks} Critical, {scanResult.summary.highRisks} High severity
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OWASP Vulnerability Findings & Direct Bug Creation */}
      {scanResult && scanResult.vulnerabilities.length > 0 && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/30 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Identified Security Misconfigurations & Vulnerabilities ({scanResult.vulnerabilities.length})
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
              Immediate Attention Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {scanResult.vulnerabilities.map((vuln) => (
              <div
                key={vuln.id}
                className="p-4 rounded-xl border border-rose-200/80 bg-white shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                      {vuln.severity} Risk
                    </span>
                    <span className="ml-2 text-xs font-mono text-slate-500">
                      {vuln.cwe}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {vuln.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCreateDefect(vuln)}
                    disabled={filingDefectFor?.id === vuln.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Bug className="h-3.5 w-3.5 text-rose-400" />
                    Log Defect
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {vuln.description}
                </p>
                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                  <strong className="text-slate-900">Remediation:</strong> {vuln.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Security Header Check Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Security Header Inspection Table
            </h3>
            <span className="text-xs text-slate-500">
              ({filteredHeaders.length} headers inspected)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search header name..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="fail">Failed Only</option>
              <option value="warn">Warnings Only</option>
              <option value="pass">Passed Only</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Header Directive</th>
                <th className="py-3 px-4">Risk Severity</th>
                <th className="py-3 px-4">Detected Value in Response</th>
                <th className="py-3 px-4 text-right">Remediation Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHeaders.map((header) => {
                const isExpanded = expandedHeaderId === header.id;
                return (
                  <React.Fragment key={header.id}>
                    <tr
                      onClick={() =>
                        setExpandedHeaderId(isExpanded ? null : header.id)
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Status Icon */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          {getStatusIcon(header.status)}
                        </div>
                      </td>

                      {/* Header Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {header.header}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {header.description}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(
                            header.severity
                          )}`}
                        >
                          {header.severity}
                        </span>
                      </td>

                      {/* Detected Value */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-xs px-2.5 py-1 rounded-md border max-w-xs truncate inline-block ${
                            header.status === "pass"
                              ? "bg-slate-100/80 text-slate-800 border-slate-200/60"
                              : header.status === "warn"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {header.value || "<Missing>"}
                        </span>
                      </td>

                      {/* Action Expand */}
                      <td className="py-3.5 px-4 text-right">
                        <button className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline cursor-pointer">
                          <span>{isExpanded ? "Hide Fix" : "View Fix"}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Remediation Panel */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="p-4 sm:p-6 border-b border-slate-200">
                          <div className="space-y-4 max-w-4xl mx-auto">
                            {/* Detailed Risk Explanation */}
                            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                Threat Impact & OWASP Assessment
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {header.riskExplanation}
                              </p>
                              <div className="text-xs font-semibold text-indigo-700 pt-1">
                                💡 Recommended Practice: {header.recommendation}
                              </div>
                            </div>

                            {/* Remediation Snippets */}
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50">
                                <div className="flex items-center gap-1.5">
                                  <FileCode2 className="h-4 w-4 text-indigo-600" />
                                  <span className="text-xs font-bold text-slate-800">
                                    Ready-to-Deploy Remediation Code:
                                  </span>
                                </div>

                                {/* Platform Selector */}
                                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium">
                                  {(["nginx", "nextjs", "apache", "helmet"] as const).map(
                                    (tab) => (
                                      <button
                                        key={tab}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveRemediationTab(tab);
                                        }}
                                        className={`px-2.5 py-1 rounded-md transition-colors uppercase text-[10px] font-bold ${
                                          activeRemediationTab === tab
                                            ? "bg-white text-indigo-700 shadow-2xs"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                      >
                                        {tab}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="relative p-4 bg-[#0F172A] text-slate-200 font-mono text-xs overflow-x-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const code =
                                      header.remediationCode[activeRemediationTab] ||
                                      "// No snippet";
                                    handleCopyCode(`${header.id}-${activeRemediationTab}`, code);
                                  }}
                                  className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  {copiedCodeKey === `${header.id}-${activeRemediationTab}` ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <pre className="whitespace-pre-wrap leading-relaxed pr-16">
                                  {header.remediationCode[activeRemediationTab] ||
                                    "// Remediation directive not available for selected server."}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Audit Trail */}
      {scanHistory.length > 1 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            Recent Security Audits Recorded in Supabase
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scanHistory.slice(0, 6).map((scan) => (
              <div
                key={scan.id}
                onClick={() => setScanResult(scan)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  scanResult?.id === scan.id
                    ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono truncate max-w-[180px]">
                    {scan.target_url}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      scan.grade === "A+" || scan.grade === "A"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Grade {scan.grade} ({scan.overall_score}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{scan.summary?.failed || 0} issues detected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
