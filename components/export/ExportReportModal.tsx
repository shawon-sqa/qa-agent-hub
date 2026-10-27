"use client";

import React, { useState } from "react";
import {
  Download,
  FileText,
  Table,
  FileCode,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ExportFormat,
  ProfessionalReportData,
  downloadReportFile,
} from "@/lib/export/reportExporter";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ProfessionalReportData;
}

export function ExportReportModal({
  isOpen,
  onClose,
  reportData,
}: ExportReportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [includeRequirements, setIncludeRequirements] = useState(true);
  const [includeFlows, setIncludeFlows] = useState(true);
  const [includeTestCases, setIncludeTestCases] = useState(true);
  const [sanitizeSecrets, setSanitizeSecrets] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadReportFile(reportData, {
      format,
      includeRequirements,
      includeFlows,
      includeTestCases,
      sanitizeSecrets,
    });

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1500);
  };

  const formats: Array<{
    id: ExportFormat;
    title: string;
    ext: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "markdown",
      title: "Markdown Specification",
      ext: ".md",
      desc: "Full Software Requirements Specification (SRS) & Audit Plan for GitHub and developer docs.",
      icon: <FileText className="h-5 w-5 text-blue-500" />,
    },
    {
      id: "csv",
      title: "Traceability Matrix Spreadsheet",
      ext: ".csv",
      desc: "RFC 4180 CSV export with requirements, decision flows, and test cases for Jira / Excel.",
      icon: <Table className="h-5 w-5 text-emerald-500" />,
    },
    {
      id: "html",
      title: "Printable Executive HTML Dashboard",
      ext: ".html",
      desc: "Self-contained visual report with dark navy banner, KPI gauges, and styled verification tables.",
      icon: <Globe className="h-5 w-5 text-cyan-500" />,
    },
    {
      id: "json",
      title: "Full JSON Machine-Readable Bundle",
      ext: ".json",
      desc: "Complete structured JSON data model for CI/CD pipelines and automated ingestion.",
      icon: <FileCode className="h-5 w-5 text-purple-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Professional Report Export System
              </h3>
              <p className="text-xs text-slate-500">
                Project: <strong className="text-slate-800">{reportData.project.name}</strong> ({reportData.project.domain})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Format Selector Cards */}
        <div className="mt-4 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Choose Output Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {formats.map((f) => {
              const isSelected = format === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/30"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{f.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {f.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {f.ext}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scope and Anti-Leak Options */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Export Configuration
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Anti-Leak Guard Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeRequirements}
                onChange={(e) => setIncludeRequirements(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>System Requirements ({reportData.requirements?.length || 0})</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFlows}
                onChange={(e) => setIncludeFlows(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Business Flows ({reportData.flows?.length || 0})</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTestCases}
                onChange={(e) => setIncludeTestCases(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Test Matrix Cases ({reportData.testCases?.length || 0})</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-emerald-800">
              <input
                type="checkbox"
                checked={sanitizeSecrets}
                onChange={(e) => setSanitizeSecrets(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Scrub Secrets & Tokens</span>
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Report ({format.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
