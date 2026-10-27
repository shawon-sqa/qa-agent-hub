"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentProjectsTable } from "@/components/dashboard/RecentProjectsTable";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import { ModulePlaceholder } from "@/components/dashboard/ModulePlaceholder";
import { RequirementsModule } from "@/components/requirements/RequirementsModule";
import { WebsiteAnalysisModule } from "@/components/website-analysis/WebsiteAnalysisModule";
import { ManualQaExecutionBoard } from "@/components/manual-qa/ManualQaExecutionBoard";
import { DefectManagementBoard } from "@/components/defect-management/DefectManagementBoard";
import { ApiTestingWorkspace } from "@/components/api-testing/ApiTestingWorkspace";
import { PlaywrightWorkspace } from "@/components/playwright/PlaywrightWorkspace";
import { SecurityTestingWorkspace } from "@/components/security-testing/SecurityTestingWorkspace";
import { PerformanceTestingWorkspace } from "@/components/performance-testing/PerformanceTestingWorkspace";
import { NavModuleId } from "@/types/dashboard";
import { CURRENT_USER } from "@/data/dashboardData";
import {
  Play,
  RefreshCw,
  Cpu,
} from "lucide-react";

interface DashboardShellProps {
  initialModule?: NavModuleId;
}

const emptySubscribe = () => () => {};

export function DashboardShell({ initialModule = "dashboard" }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<NavModuleId>(initialModule);
  const [searchQuery, setSearchQuery] = useState("");
  const currentDate = useSyncExternalStore(
    emptySubscribe,
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    () => "QA Agent Hub Active"
  );
  const [statusNotification, setStatusNotification] = useState<string | null>(
    null
  );

  const showNotification = (message: string) => {
    setStatusNotification(message);
    setTimeout(() => {
      setStatusNotification(null);
    }, 4000);
  };

  const handleActionClick = (actionName: string) => {
    showNotification(`⚡ Action triggered: "${actionName}" is now executing.`);
  };

  const handleRunProject = (projectName: string) => {
    showNotification(`🚀 Playwright test suite launched for "${projectName}".`);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {/* 1. Dark Navy Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      {/* 2. Main Content Area (Clean Light Theme) */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header with Search and Shawon Profile Dropdown */}
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Global Toast Notification */}
        {statusNotification && (
          <div className="bg-slate-900 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{statusNotification}</span>
            </div>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {activeModule === "dashboard" ? (
            <>
              {/* Welcome Header Banner */}
              <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/40 p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                        Autonomous QA Hub
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        {currentDate || "QA Agent Hub Active"}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      Welcome back, {CURRENT_USER.name} 👋
                    </h1>

                    <p className="text-sm text-slate-600 max-w-2xl">
                      All 8 automated test suites are passing with{" "}
                      <strong className="text-emerald-600 font-semibold">
                        98.2% test coverage
                      </strong>
                      . 4 background AI agents are actively monitoring regressions and API endpoints.
                    </p>
                  </div>

                  {/* Header CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleActionClick("Full Regression Run")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Run All Suites
                    </button>
                    <button
                      onClick={() => handleActionClick("Sync Repositories")}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                      Sync Repos
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <QuickActions onActionClick={handleActionClick} />

              {/* Quick Stats Grid */}
              <QuickStats />

              {/* Two Column Layout: Recent Projects Table & Live Activity Feed */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                {/* Recent Projects Table Placeholder (2 Cols on XL) */}
                <div className="xl:col-span-2">
                  <RecentProjectsTable
                    searchQuery={searchQuery}
                    onRunProject={handleRunProject}
                  />
                </div>

                {/* Right Side: Live Agent Feed & System Health */}
                <div className="space-y-6">
                  <LiveActivityFeed />

                  {/* System & Cloud Runner Health Box */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-600" />
                        Infrastructure Health
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        99.98% Uptime
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>Playwright Cloud Workers</span>
                          <span className="font-semibold text-slate-900">
                            4 / 8 Nodes Active
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-1/2 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>API Mock Server Latency</span>
                          <span className="font-semibold text-slate-900">
                            18ms (Optimal)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-4/5 rounded-full" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cluster: AWS us-east-1</span>
                        <span>SHA: 4fa908e</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeModule === "requirements" ? (
            <RequirementsModule />
          ) : activeModule === "website-analysis" ? (
            <WebsiteAnalysisModule />
          ) : activeModule === "manual-qa" ? (
            <ManualQaExecutionBoard />
          ) : activeModule === "defect-management" ? (
            <DefectManagementBoard />
          ) : activeModule === "api-testing" ? (
            <ApiTestingWorkspace />
          ) : activeModule === "playwright-automation" ? (
            <PlaywrightWorkspace />
          ) : activeModule === "security-testing" ? (
            <SecurityTestingWorkspace />
          ) : activeModule === "performance-testing" || activeModule === "performance" ? (
            <PerformanceTestingWorkspace />
          ) : (
            /* Selected Module Screen */
            <ModulePlaceholder
              moduleId={activeModule}
              onBackToDashboard={() => setActiveModule("dashboard")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
