"use client";

import React from "react";
import { NAVIGATION_ITEMS } from "@/data/dashboardData";
import { NavModuleId } from "@/types/dashboard";
import {
  ArrowLeft,
  Bot,
  Play,
  Sparkles,
  CheckCircle2,
  FileCode,
  Sliders,
} from "lucide-react";

interface ModulePlaceholderProps {
  moduleId: NavModuleId;
  onBackToDashboard: () => void;
}

export function ModulePlaceholder({
  moduleId,
  onBackToDashboard,
}: ModulePlaceholderProps) {
  const currentItem = NAVIGATION_ITEMS.find((item) => item.id === moduleId);
  const Icon = currentItem?.icon || Bot;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B132B] text-white shadow-md shadow-slate-900/10">
              <Icon className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                {currentItem?.label}
                {currentItem?.badge && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {currentItem.badge}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500">
                Module Category: <span className="font-semibold text-slate-700">{currentItem?.category}</span> • Autonomous Agent Orchestration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`Starting agent for ${currentItem?.label}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Execute {currentItem?.label} Agent
          </button>
        </div>
      </div>

      {/* Module Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Automated Capabilities & Agent Pipeline
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Engine Online
            </span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            The <strong className="text-slate-900">{currentItem?.label}</strong> engine is connected to Shawon Ahmed&apos;s workspace. This module coordinates intelligent crawlers, test suite validators, and automated regression runners with seamless cloud execution.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Continuous Sync
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Monitors Git branches and triggers automated checks on merge.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-blue-600" /> Playwright & API Interop
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Generates robust TypeScript test specs with zero flakiness.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Config Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            Module Settings
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span>Auto-Heal Selectors</span>
              <span className="font-semibold text-emerald-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span>Concurrency</span>
              <span className="font-semibold text-slate-800">4 Workers</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span>Headless Chrome</span>
              <span className="font-semibold text-slate-800">Ready</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Owner</span>
              <span className="font-semibold text-slate-800">Shawon Ahmed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
