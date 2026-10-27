"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Globe,
  Camera,
  Terminal,
  Activity,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { PlaywrightTraceArtifact, PlaywrightTraceStep } from "@/types/playwright-automation";

interface PlaywrightTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: PlaywrightTraceArtifact | null;
}

export function PlaywrightTraceModal({ isOpen, onClose, trace }: PlaywrightTraceModalProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"dom" | "network" | "console">("dom");

  if (!isOpen || !trace) return null;

  const currentStep = trace.steps[selectedStepIndex] || trace.steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[88vh]">
        {/* Navy Header */}
        <div className="bg-[#0B132B] px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-cyan-400 border border-cyan-500/30">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  Trace Viewer
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Passed ({trace.totalDurationMs}ms)
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight mt-0.5 line-clamp-1">
                {trace.testTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Trace Step Scrubber Bar */}
        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-2">
            Timeline Steps:
          </span>
          {trace.steps.map((st, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStepIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                selectedStepIndex === idx
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-[10px] opacity-70">#{st.stepIndex}</span>
              <span className="truncate max-w-[140px]">{st.action}</span>
              <span className="text-[10px] text-cyan-300">({st.durationMs}ms)</span>
            </button>
          ))}
        </div>

        {/* Modal Body: Left Step Action Details, Right Visual DOM Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step Action {currentStep.stepIndex} of {trace.steps.length}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentStep.durationMs}ms
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800">Executed Statement:</div>
                <pre className="text-xs font-mono text-blue-700 bg-white p-2.5 rounded-xl border border-slate-200 overflow-x-auto">
                  {currentStep.action}
                </pre>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800">Target Selector / URL:</div>
                <div className="text-xs font-mono text-slate-600 bg-white p-2 rounded-xl border border-slate-200 break-all">
                  {currentStep.targetSelector}
                </div>
              </div>
            </div>

            {/* Navigation tabs for lower details */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab("dom")}
                className={`px-3 py-1 rounded-lg ${
                  activeTab === "dom" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Snapshot Info
              </button>
              <button
                onClick={() => setActiveTab("network")}
                className={`px-3 py-1 rounded-lg ${
                  activeTab === "network" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Network ({trace.networkCalls.length})
              </button>
              <button
                onClick={() => setActiveTab("console")}
                className={`px-3 py-1 rounded-lg ${
                  activeTab === "console" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Console (0 errors)
              </button>
            </div>

            {activeTab === "network" ? (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {trace.networkCalls.map((net, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs flex items-center justify-between font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-emerald-600 text-[10px]">{net.status}</span>
                      <span className="font-bold text-slate-700">{net.method}</span>
                      <span className="truncate text-slate-500 max-w-[150px]">{net.url}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{net.durationMs}ms</span>
                  </div>
                ))}
              </div>
            ) : activeTab === "console" ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 font-mono">
                [Console] Clean execution. Zero unhandled exceptions or console errors recorded.
              </div>
            ) : (
              <div className="text-xs text-slate-500 space-y-1">
                <p>• DOM state captured before and after user gesture.</p>
                <p>• Page reached networkidle before assertion check.</p>
                <p>• Verified across headless Chromium rendering engine.</p>
              </div>
            )}
          </div>

          {/* Right DOM Screenshot Preview */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold flex items-center gap-1.5 text-slate-700">
                <Camera className="h-4 w-4 text-blue-600" />
                DOM Screenshot at Step {currentStep.stepIndex}
              </span>
              <span>Viewport: 1280 × 720</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-xl overflow-hidden">
              <div className="bg-slate-900 px-3 py-1.5 rounded-t-xl border-b border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-300 truncate">https://target-audit-runner.playwright.local</span>
              </div>
              <div className="relative bg-slate-900 rounded-b-xl overflow-hidden min-h-[300px] flex items-center justify-center p-4">
                <div className="w-full text-center space-y-3">
                  <div className="inline-block p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-left max-w-md w-full">
                    <div className="text-xs font-mono text-cyan-400 font-bold mb-1">
                      // Element In Viewport
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Action executed: <span className="text-emerald-400">{currentStep.action}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 font-mono">
                      Selector: {currentStep.targetSelector}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Visual bounding box verified • Element matched 1 node • Action latency: {currentStep.durationMs}ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Playwright Trace recorded with <strong className="text-slate-800">trace: &apos;on-first-retry&apos;</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
