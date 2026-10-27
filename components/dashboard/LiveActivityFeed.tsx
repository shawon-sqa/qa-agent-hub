"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import { RECENT_ACTIVITIES } from "@/data/dashboardData";
import { AgentActivity } from "@/types/dashboard";

export function LiveActivityFeed() {
  const getStatusIcon = (status: AgentActivity["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Autonomous Agent Activity
            </h4>
            <p className="text-[11px] text-slate-500">Live test runner telemetry</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5">
          Live stream <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>

      <div className="mt-4 space-y-3.5">
        {RECENT_ACTIVITIES.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
          >
            {getStatusIcon(activity.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {activity.agentName}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {activity.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {activity.action}
              </p>
              <div className="mt-1 text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60 inline-block truncate max-w-full">
                {activity.target}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
