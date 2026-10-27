"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PlayCircle,
  FileCode,
  Layers,
  Copy,
  Check,
  Download,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  RefreshCw,
  Folder,
  FolderOpen,
  Code2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  PlaywrightPageObject,
  PlaywrightSpecFile,
  PlaywrightExecutionLog,
} from "@/types/playwright-automation";
import {
  generatePageObjects,
  generatePlaywrightSpecs,
  generatePlaywrightConfig,
  generateWorkerLogs,
  generateTraceArtifact,
} from "@/lib/playwright/playwrightEngine";
import { buildInitialManualTestCases } from "@/lib/manual-qa/manualQaService";
import { PlaywrightTraceModal } from "./PlaywrightTraceModal";

export function PlaywrightWorkspace() {
  const { activeProjectId, activeProject } = useActiveProject();

  const [pageObjects, setPageObjects] = useState<PlaywrightPageObject[]>([]);
  const [specs, setSpecs] = useState<PlaywrightSpecFile[]>([]);
  const [configCode, setConfigCode] = useState<string>("");

  // Active selected file in file tree
  const [activeFileId, setActiveFileId] = useState<string>("config");
  const [activeFileType, setActiveFileType] = useState<"spec" | "pom" | "config">("config");

  // Runner state
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<PlaywrightExecutionLog[]>([]);
  const [copied, setCopied] = useState(false);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize files based on active project
  useEffect(() => {
    const testCases = buildInitialManualTestCases(activeProject);
    const poms = generatePageObjects(activeProject);
    const generatedSpecs = generatePlaywrightSpecs(activeProject, testCases);
    const cfg = generatePlaywrightConfig(activeProject);

    setPageObjects(poms);
    setSpecs(generatedSpecs);
    setConfigCode(cfg);

    if (generatedSpecs.length > 0) {
      setActiveFileId(generatedSpecs[0].id);
      setActiveFileType("spec");
    } else {
      setActiveFileId("config");
      setActiveFileType("config");
    }

    const initialLogs = generateWorkerLogs(generatedSpecs, activeProject);
    setLogs(initialLogs);
  }, [activeProjectId]);

  // Active code content
  const activeFile = useMemo(() => {
    if (activeFileType === "config") {
      return {
        name: "playwright.config.ts",
        filename: "playwright.config.ts",
        code: configCode,
        description: "Root Playwright configuration for Chromium, Firefox, WebKit, and mobile viewport devices.",
      };
    }
    if (activeFileType === "pom") {
      const pom = pageObjects.find((p) => p.id === activeFileId) || pageObjects[0];
      return {
        name: pom?.name || "Page Object",
        filename: pom?.filename || "Page.ts",
        code: pom?.code || "",
        description: pom?.description || "",
      };
    }
    const spec = specs.find((s) => s.id === activeFileId) || specs[0];
    return {
      name: spec?.title || "Playwright E2E Spec",
      filename: spec?.filename || "e2e.spec.ts",
      code: spec?.code || "",
      description: `E2E Spec for ${spec?.testCaseCode || "Test Case"} targeting ${activeProject.name}.`,
    };
  }, [activeFileType, activeFileId, pageObjects, specs, configCode, activeProject]);

  // Execute runner simulation
  const handleRunAllSpecs = () => {
    setIsRunning(true);
    setLogs([
      {
        id: `log_start_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        workerId: 1,
        message: `[Playwright] Spawning 4 parallel worker threads on Node.js v20...`,
      },
    ]);

    setTimeout(() => {
      const freshLogs = generateWorkerLogs(specs, activeProject);
      setLogs(freshLogs);
      setIsRunning(false);
      // Mark specs passed
      setSpecs((prev) =>
        prev.map((s) => ({ ...s, status: "passed", lastRunAt: new Date().toISOString() }))
      );
    }, 1800);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([activeFile.code], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeSpec = specs.find((s) => s.id === activeFileId) || specs[0] || null;
  const traceArtifact = activeSpec ? generateTraceArtifact(activeSpec, activeProject) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                Playwright E2E Automation
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Project: {activeProject.name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-medium text-slate-500">
                Target: https://{activeProject.domain}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              TypeScript Page Object Model (POM) Workspace
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Cleanly architected TypeScript Playwright suites. Translates verified test cases into
              reusable Page Objects, locator abstractions, and parallel multi-browser execution scripts.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTraceModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Activity className="h-4 w-4 text-blue-600" />
              Trace Inspector
            </button>

            <button
              onClick={handleRunAllSpecs}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isRunning ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              <span>Run All E2E Suites</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">E2E Specs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{specs.length} Suites</div>
          <span className="text-[11px] text-slate-400">Targeting {activeProject.name}</span>
        </div>

        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Page Objects (POM)
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1">{pageObjects.length} Classes</div>
          <span className="text-[11px] text-blue-600 font-medium">Encapsulated DOM</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/30 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Passing Specs
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">100% Verified</div>
          <span className="text-[11px] text-emerald-600 font-medium">Chromium • WebKit</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5" /> Parallel Workers
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">4 Nodes</div>
          <span className="text-[11px] text-slate-400">Headless Pipeline</span>
        </div>
      </div>

      {/* Workspace Split Layout: Left File Tree, Right Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left File Tree */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              Project File Explorer
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">TypeScript</span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Specs Folder */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold px-2 py-1">
                <Folder className="h-3.5 w-3.5 text-amber-500" />
                <span>e2e/</span>
              </div>
              <div className="pl-4 space-y-0.5">
                {specs.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => {
                      setActiveFileId(spec.id);
                      setActiveFileType("spec");
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      activeFileId === spec.id && activeFileType === "spec"
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{spec.filename}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-sans font-bold">✓</span>
                  </button>
                ))}
              </div>
            </div>

            {/* POM Folder */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold px-2 py-1">
                <Folder className="h-3.5 w-3.5 text-amber-500" />
                <span>pages/ (Page Objects)</span>
              </div>
              <div className="pl-4 space-y-0.5">
                {pageObjects.map((pom) => (
                  <button
                    key={pom.id}
                    onClick={() => {
                      setActiveFileId(pom.id);
                      setActiveFileType("pom");
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      activeFileId === pom.id && activeFileType === "pom"
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{pom.filename}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Config File */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveFileId("config");
                  setActiveFileType("config");
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  activeFileType === "config"
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">playwright.config.ts</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Code Editor & Viewer */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
          {/* Editor Header Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                <Code2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-mono font-bold text-slate-900 truncate">
                  {activeFile.filename}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">{activeFile.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[520px] leading-relaxed shadow-inner">
            <pre className="counter-reset-line">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Terminal Live Execution Console */}
      <div className="rounded-3xl border border-slate-800 bg-[#0A1128] text-white shadow-xl overflow-hidden space-y-2">
        <div className="bg-[#0B132B] px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Playwright Worker Terminal Output
            </h4>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-2" />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>4 Workers Active</span>
            <span>•</span>
            <button
              onClick={() => setLogs([])}
              className="text-slate-400 hover:text-white cursor-pointer underline text-[11px]"
            >
              Clear Console
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[220px] overflow-y-auto font-mono text-xs space-y-1 text-slate-300">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
              <span
                className={`font-semibold shrink-0 ${
                  log.level === "pass"
                    ? "text-emerald-400"
                    : log.level === "step"
                    ? "text-cyan-300"
                    : log.level === "warn"
                    ? "text-amber-400"
                    : log.level === "fail"
                    ? "text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Trace Inspector Modal */}
      <PlaywrightTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        trace={traceArtifact}
      />
    </div>
  );
}
