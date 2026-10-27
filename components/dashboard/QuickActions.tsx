"use client";

import React from "react";
import {
  PlayCircle,
  Globe,
  Bot,
  FileSpreadsheet,
  PlusCircle,
} from "lucide-react";

interface QuickActionsProps {
  onActionClick?: (actionName: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    {
      title: "Run Playwright Suite",
      description: "Execute end-to-end regression tests",
      icon: PlayCircle,
      gradient: "from-blue-600 to-indigo-600",
      border: "border-blue-500/20 hover:border-blue-500/50",
      bgHover: "hover:bg-blue-50/60",
      tag: "Fast Runner",
      actionId: "run-playwright",
    },
    {
      title: "Website URL Analysis",
      description: "Scan target DOM, routes & accessibility",
      icon: Globe,
      gradient: "from-cyan-600 to-blue-600",
      border: "border-cyan-500/20 hover:border-cyan-500/50",
      bgHover: "hover:bg-cyan-50/60",
      tag: "AI Crawler",
      actionId: "website-analysis",
    },
    {
      title: "AI Bug & Flow Scanner",
      description: "Autonomous exploration for broken flows",
      icon: Bot,
      gradient: "from-purple-600 to-pink-600",
      border: "border-purple-500/20 hover:border-purple-500/50",
      bgHover: "hover:bg-purple-50/60",
      tag: "Autonomous",
      actionId: "ai-scanner",
    },
    {
      title: "Generate QA Audit Report",
      description: "Compile stakeholder PDF/HTML summary",
      icon: FileSpreadsheet,
      gradient: "from-emerald-600 to-teal-600",
      border: "border-emerald-500/20 hover:border-emerald-500/50",
      bgHover: "hover:bg-emerald-50/60",
      tag: "Export Ready",
      actionId: "qa-report",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
          <p className="text-xs text-slate-500">
            Launch autonomous agents or run automated suites with one click
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
          <PlusCircle className="h-3.5 w-3.5" /> New Custom Action
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.actionId}
              onClick={() => onActionClick?.(act.title)}
              className={`group flex flex-col justify-between p-4 rounded-2xl bg-white border ${act.border} shadow-xs hover:shadow-md transition-all duration-200 text-left cursor-pointer ${act.bgHover}`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${act.gradient} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                  {act.tag}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {act.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
