"use client";

import React, { useState } from "react";
import { X, PlayCircle, Layers, Globe, User, FileText, Check } from "lucide-react";

interface TestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectEnvironment: string;
  availableSuites: string[];
  onCreateRun: (data: {
    name: string;
    suiteName: string;
    environment: string;
    testerName: string;
    notes?: string;
  }) => void;
}

export function TestRunModal({
  isOpen,
  onClose,
  projectName,
  projectEnvironment,
  availableSuites,
  onCreateRun,
}: TestRunModalProps) {
  const [name, setName] = useState(`Sprint 14 Manual Regression - ${projectName}`);
  const [suiteName, setSuiteName] = useState(availableSuites[0] || "All Test Suites");
  const [environment, setEnvironment] = useState(projectEnvironment || "Staging");
  const [testerName, setTesterName] = useState("Shawon Ahmed");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateRun({
      name: name.trim(),
      suiteName,
      environment,
      testerName: testerName.trim(),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Navy Header */}
        <div className="bg-[#0B132B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-cyan-400 border border-cyan-500/30">
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Start New Test Run
              </h2>
              <p className="text-xs text-slate-400">
                Preserves execution history and records step-by-step audit
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Test Run Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              placeholder="e.g. Release 2.4 Checkout & Cart Regression"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Target Test Suite
              </label>
              <select
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="All Test Suites">All Test Suites (Full Pack)</option>
                {availableSuites
                  .filter((s) => s !== "All Test Suites")
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
                <option value="Development">Development</option>
                <option value="QA / Testing">QA / Testing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Assigned Tester
            </label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Run Notes / Scope (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verifying patch for payment gateway timeout issue on build #204..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <PlayCircle className="h-4 w-4" /> Start Execution Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
