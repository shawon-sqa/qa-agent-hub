"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Play,
  RotateCw,
  Clock,
  Gauge,
  Activity,
  Download,
  Copy,
  Check,
  Server,
  Layers,
  FileCode,
  HardDrive,
  Cpu,
  Sparkles,
  ArrowRight,
  Terminal,
  BarChart3,
  Globe,
} from "lucide-react";
import {
  PerformanceAuditRun,
  CoreWebVitals,
  WebVitalRating,
  PerformanceMetricBreakdown,
} from "@/types/performance-testing";
import { useActiveProject } from "@/lib/projects/projectState";
import { supabase } from "@/lib/supabase/client";

export function PerformanceTestingWorkspace() {
  const { activeProject, projects, activeProjectId } = useActiveProject();

  const defaultDomain = activeProject?.domain || "app.opsroi.com";
  const [targetUrl, setTargetUrl] = useState(`https://${defaultDomain}`);
  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<PerformanceAuditRun | null>(null);
  const [auditHistory, setAuditHistory] = useState<PerformanceAuditRun[]>([]);

  // Load Test Generator Configuration
  const [scriptType, setScriptType] = useState<"k6" | "artillery">("k6");
  const [vus, setVus] = useState<number>(50);
  const [duration, setDuration] = useState<number>(60);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Update target URL when active project changes
  useEffect(() => {
    if (activeProject?.domain) {
      setTargetUrl(`https://${activeProject.domain}`);
    }
  }, [activeProject]);

  // Load recent audits from Supabase
  useEffect(() => {
    async function loadHistory() {
      try {
        const { data, error } = await supabase
          .from("performance_scans")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          const parsed: PerformanceAuditRun[] = data.map((d) => ({
            id: d.id,
            project_id: d.project_id,
            target_url: d.target_url,
            tested_by: d.tested_by,
            performance_score: d.performance_score,
            latency_ms: d.latency_ms,
            payload_size_kb: Number(d.payload_size_kb),
            web_vitals: d.web_vitals as unknown as CoreWebVitals,
            metrics: d.metrics as unknown as PerformanceMetricBreakdown,
            score_breakdown: d.score_breakdown as unknown as PerformanceAuditRun["score_breakdown"],
            k6_script: d.k6_script || "",
            artillery_script: d.artillery_script || "",
            status: d.status as "completed" | "in_progress" | "failed",
            created_at: d.created_at,
          }));
          setAuditHistory(parsed);
          setAuditResult(parsed[0]);
          return;
        }
      } catch {
        // Fallback
      }

      // Initial execution if empty
      executePerformanceAudit(`https://${defaultDomain}`);
    }

    loadHistory();
  }, [activeProjectId]);

  const executePerformanceAudit = async (urlOverride?: string) => {
    const url = urlOverride || targetUrl;
    setIsRunning(true);

    try {
      const resp = await fetch("/api/performance-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: url,
          projectId: activeProjectId || "default-project",
          vus,
          duration,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.run) {
        setAuditResult(data.run);
        setAuditHistory((prev) => [data.run, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.error("Performance audit error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = () => {
    if (!auditResult) return;
    const isK6 = scriptType === "k6";
    const content = isK6 ? auditResult.k6_script : auditResult.artillery_script;
    const filename = isK6 ? "qa-hub-load-test.js" : "qa-hub-artillery.yml";
    const mime = isK6 ? "text/javascript" : "text/yaml";

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRatingBadge = (rating: WebVitalRating) => {
    switch (rating) {
      case "good":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "needs-improvement":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "poor":
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  // Active script text based on generator tabs
  const activeScriptCode = useMemo(() => {
    if (!auditResult) return "";
    return scriptType === "k6" ? auditResult.k6_script : auditResult.artillery_script;
  }, [auditResult, scriptType]);

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-xs">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Performance & Load Testing Hub
              </h1>
              <p className="text-sm text-slate-500">
                Live latency telemetry, Core Web Vitals profiling & 1-click k6 / Artillery script generation
              </p>
            </div>
          </div>
        </div>

        {/* Lead Engineer Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            Performance Engineer: <strong className="ml-1 text-slate-800">Shawon Ahmed</strong>
          </div>
        </div>
      </div>

      {/* Target URL & Execution Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com or active API endpoint"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <button
            onClick={() => executePerformanceAudit()}
            disabled={isRunning || !targetUrl}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin text-amber-400" />
                Measuring Telemetry...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-amber-400 text-amber-400" />
                Run Performance Audit
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
                executePerformanceAudit(url);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 border border-slate-200/60 transition-colors cursor-pointer"
            >
              {proj.name} ({proj.domain})
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Overview Cards */}
      {auditResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Circular Score Gauge */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Performance Score
              </span>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {auditResult.performance_score}
                </span>
                <span className="text-sm font-normal text-slate-400"> / 100</span>
              </div>
              <span
                className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  auditResult.performance_score >= 90
                    ? "bg-emerald-50 text-emerald-700"
                    : auditResult.performance_score >= 50
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {auditResult.performance_score >= 90
                  ? "Optimal (Production Ready)"
                  : "Needs Optimization"}
              </span>
            </div>

            {/* SVG Circular Gauge */}
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    auditResult.performance_score >= 90
                      ? "text-emerald-500"
                      : auditResult.performance_score >= 50
                      ? "text-amber-500"
                      : "text-rose-500"
                  }
                  strokeDasharray={`${auditResult.performance_score}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                {auditResult.performance_score}%
              </div>
            </div>
          </div>

          {/* Response Latency */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Total Latency</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold text-slate-900">
                {auditResult.latency_ms}
                <span className="text-sm font-normal text-slate-400"> ms</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span>TTFB:</span>
                <strong className="text-slate-800 font-mono">
                  {auditResult.metrics.ttfbMs}ms
                </strong>
                <span className="text-emerald-600 font-medium">(SLA &lt;200ms)</span>
              </p>
            </div>
          </div>

          {/* Payload Size & Compression */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Transfer Payload</span>
              <HardDrive className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold text-slate-900">
                {auditResult.payload_size_kb}
                <span className="text-sm font-normal text-slate-400"> KB</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span>Compression:</span>
                <span className="uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                  {auditResult.metrics.compression}
                </span>
              </p>
            </div>
          </div>

          {/* HTTP Protocol & Caching */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Protocol & Edge Cache</span>
              <Server className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-slate-900 truncate">
                {auditResult.metrics.httpVersion}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span>Cache:</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                  {auditResult.metrics.cacheStatus}
                </span>
                <span className="text-emerald-600 font-medium">Status {auditResult.metrics.statusCode}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Core Web Vitals (CWV) Dashboard */}
      {auditResult && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                Simulated Core Web Vitals (CWV) & Field Metrics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated from real server response telemetry, TTFB and asset delivery characteristics
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                ● Good (&lt; 2.5s)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                ● Needs Improvement
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(auditResult.web_vitals).map((vital) => (
              <div
                key={vital.acronym}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                      {vital.acronym}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {vital.name}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${getRatingBadge(
                      vital.rating
                    )}`}
                  >
                    {vital.rating}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {vital.value}
                    <span className="text-sm font-normal text-slate-500 ml-0.5">
                      {vital.unit}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400">Target: {vital.threshold}</span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {vital.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latency Waterfall Breakdown */}
      {auditResult && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            Network Timing Breakdown (Waterfall)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block mb-1">DNS Lookup</span>
              <span className="font-mono font-bold text-slate-900">
                {auditResult.metrics.dnsLookupMs} ms
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block mb-1">TCP Connect</span>
              <span className="font-mono font-bold text-slate-900">
                {auditResult.metrics.tcpHandshakeMs} ms
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block mb-1">TLS Handshake</span>
              <span className="font-mono font-bold text-slate-900">
                {auditResult.metrics.tlsNegotiationMs} ms
              </span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60">
              <span className="text-amber-700 block mb-1">Server TTFB</span>
              <span className="font-mono font-bold text-amber-900">
                {auditResult.metrics.ttfbMs} ms
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
              <span className="text-emerald-700 block mb-1">Content Transfer</span>
              <span className="font-mono font-bold text-emerald-900">
                {auditResult.metrics.downloadMs} ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Load Testing Script Generator (k6 & Artillery) */}
      {auditResult && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  1-Click Load Testing Script Generator
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Production-ready k6 & Artillery stress testing scripts configured with SLA thresholds
              </p>
            </div>

            {/* Config & Platform Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {/* VUs selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span>VUs:</span>
                <select
                  value={vus}
                  onChange={(e) => {
                    const newVus = Number(e.target.value);
                    setVus(newVus);
                  }}
                  className="font-bold text-slate-800 bg-transparent focus:outline-hidden"
                >
                  <option value={10}>10 VUs</option>
                  <option value={50}>50 VUs</option>
                  <option value={100}>100 VUs</option>
                  <option value={250}>250 VUs</option>
                  <option value={500}>500 VUs</option>
                </select>
              </div>

              {/* Duration selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span>Duration:</span>
                <select
                  value={duration}
                  onChange={(e) => {
                    const newDur = Number(e.target.value);
                    setDuration(newDur);
                  }}
                  className="font-bold text-slate-800 bg-transparent focus:outline-hidden"
                >
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                  <option value={180}>3 mins</option>
                  <option value={300}>5 mins</option>
                </select>
              </div>

              {/* Framework Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setScriptType("k6")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    scriptType === "k6"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  k6 (ES6)
                </button>
                <button
                  onClick={() => setScriptType("artillery")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    scriptType === "artillery"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Artillery (YAML)
                </button>
              </div>

              {/* Action buttons */}
              <button
                onClick={() => handleCopyScript(activeScriptCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadScript}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative bg-[#0F172A] p-5 text-slate-200 font-mono text-xs overflow-x-auto max-h-[360px] overflow-y-auto">
            <pre className="whitespace-pre leading-relaxed">
              {activeScriptCode}
            </pre>
          </div>

          {/* Quick Execution CLI Tip */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>Run in terminal:</span>
              <code className="text-emerald-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
                {scriptType === "k6"
                  ? "k6 run qa-hub-load-test.js"
                  : "artillery run qa-hub-artillery.yml"}
              </code>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Includes auto-threshold validations on 95th percentile &lt; 500ms
            </span>
          </div>
        </div>
      )}

      {/* Historical Performance Audits */}
      {auditHistory.length > 1 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            Previous Performance Runs Stored in Supabase
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {auditHistory.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => setAuditResult(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  auditResult?.id === item.id
                    ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono truncate max-w-[180px]">
                    {item.target_url}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      item.performance_score >= 90
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Score {item.performance_score}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Latency: {item.latency_ms}ms</span>
                  <span>{item.payload_size_kb} KB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
