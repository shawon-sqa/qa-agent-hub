"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Copy,
  Check,
  FileCode,
  List,
  ShieldCheck,
  AlertTriangle,
  Code2,
} from "lucide-react";
import { ApiResponse } from "@/types/api-testing";

interface ApiResponseViewerProps {
  response: ApiResponse | null;
  isLoading: boolean;
}

export function ApiResponseViewer({ response, isLoading }: ApiResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<"body" | "headers" | "assertions" | "raw">("body");
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full min-h-[380px] rounded-3xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <h3 className="text-sm font-bold text-slate-800">Sending API Request...</h3>
        <p className="text-xs text-slate-400">
          Executing via server proxy and validating assertion criteria
        </p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full min-h-[380px] rounded-3xl border border-slate-200/80 bg-white p-8 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Code2 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">No Response Yet</h3>
        <p className="text-xs max-w-sm">
          Select or construct an API request and click <strong className="text-blue-600">Send</strong> to inspect status codes, headers, and validated response assertions.
        </p>
      </div>
    );
  }

  const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
  const isClientError = response.statusCode >= 400 && response.statusCode < 500;
  const isServerError = response.statusCode >= 500;

  const passedAssertions = response.assertionsResults.filter((a) => a.passed).length;
  const totalAssertions = response.assertionsResults.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Response Header Status Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status Code & Metrics */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Badge */}
          <div
            className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${
              isSuccess
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : isClientError
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : isServerError
                ? "bg-rose-100 text-rose-800 border border-rose-300"
                : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              {response.statusCode} {response.statusText}
            </span>
          </div>

          {/* Time Metric */}
          <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{response.timeMs}ms</span>
          </div>

          {/* Size Metric */}
          <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-1">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatSize(response.sizeBytes)}</span>
          </div>

          {/* Assertions Pill */}
          {totalAssertions > 0 && (
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                passedAssertions === totalAssertions
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                Assertions: {passedAssertions}/{totalAssertions}
              </span>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy Response</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-slate-200 bg-white flex items-center gap-1 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab("body")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "body"
              ? "border-blue-600 text-blue-600"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          JSON Body
        </button>

        <button
          onClick={() => setActiveTab("headers")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "headers"
              ? "border-blue-600 text-blue-600"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Headers ({Object.keys(response.headers).length})
        </button>

        {totalAssertions > 0 && (
          <button
            onClick={() => setActiveTab("assertions")}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "assertions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Assertions ({passedAssertions}/{totalAssertions})
          </button>
        )}

        <button
          onClick={() => setActiveTab("raw")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "raw"
              ? "border-blue-600 text-blue-600"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Raw Output
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
        {activeTab === "body" && (
          <div className="rounded-2xl bg-slate-950 p-4 overflow-x-auto text-xs font-mono text-slate-100 leading-relaxed shadow-inner">
            <pre>
              {response.parsedJson
                ? JSON.stringify(response.parsedJson, null, 2)
                : response.body || "// Empty response body"}
            </pre>
          </div>
        )}

        {activeTab === "headers" && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Header Key</th>
                  <th className="py-2.5 px-4">Header Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(response.headers).map(([key, val], idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2 px-4 font-semibold text-slate-800">{key}</td>
                    <td className="py-2 px-4 text-slate-600 break-all">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "assertions" && (
          <div className="space-y-2.5">
            {response.assertionsResults.map((assert) => (
              <div
                key={assert.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  assert.passed
                    ? "bg-emerald-50/40 border-emerald-200/90 text-emerald-950"
                    : "bg-rose-50/40 border-rose-300 text-rose-950"
                }`}
              >
                {assert.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white/70">
                      {assert.type.replace("_", " ")}
                    </span>
                    <span className="font-semibold">{assert.message}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Expected: <span className="font-bold text-slate-800">{assert.expected}</span> • Actual: <span className="font-bold text-slate-800">{assert.actual}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "raw" && (
          <textarea
            readOnly
            value={response.body}
            rows={14}
            className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none resize-none"
          />
        )}
      </div>
    </div>
  );
}
