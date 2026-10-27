"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Play,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { RECENT_PROJECTS } from "@/data/dashboardData";
import { QAProject } from "@/types/dashboard";

interface RecentProjectsTableProps {
  searchQuery?: string;
  onRunProject?: (projectName: string) => void;
}

export function RecentProjectsTable({
  searchQuery = "",
  onRunProject,
}: RecentProjectsTableProps) {
  const [filterEnv, setFilterEnv] = useState<string>("All");

  const filteredProjects = RECENT_PROJECTS.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.assignedAgent.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEnv =
      filterEnv === "All" || project.environment === filterEnv;

    return matchesSearch && matchesEnv;
  });

  const getStatusBadge = (status: QAProject["status"]) => {
    switch (status) {
      case "Passed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Passed
          </span>
        );
      case "Running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            Running
          </span>
        );
      case "Warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Needs Attention
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            Regression Failed
          </span>
        );
    }
  };

  const getEnvironmentBadge = (env: QAProject["environment"]) => {
    switch (env) {
      case "Production":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Staging":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Dev":
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Recent QA Projects & Test Suites
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredProjects.length} Targets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of connected domains, Playwright runs, and pass rates
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
          {["All", "Production", "Staging", "Dev"].map((env) => (
            <button
              key={env}
              onClick={() => setFilterEnv(env)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterEnv === env
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Target Project & Domain
              </th>
              <th scope="col" className="px-4 py-3.5">
                Environment
              </th>
              <th scope="col" className="px-4 py-3.5">
                Pass Rate
              </th>
              <th scope="col" className="px-4 py-3.5">
                Last Run
              </th>
              <th scope="col" className="px-4 py-3.5">
                Status
              </th>
              <th scope="col" className="px-4 py-3.5">
                Assigned Agent
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No projects match your filter or search query.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Name and Domain */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </span>
                      <a
                        href={`https://${project.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-0.5"
                      >
                        {project.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>

                  {/* Environment */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getEnvironmentBadge(
                        project.environment
                      )}`}
                    >
                      {project.environment}
                    </span>
                  </td>

                  {/* Pass Rate Bar */}
                  <td className="px-4 py-4 min-w-[140px]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span
                          className={
                            project.passRate >= 98
                              ? "text-emerald-700"
                              : project.passRate >= 90
                              ? "text-amber-700"
                              : "text-rose-700"
                          }
                        >
                          {project.passRate}%
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {project.totalTests} tests
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            project.passRate >= 98
                              ? "bg-emerald-500"
                              : project.passRate >= 90
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${project.passRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Last Run */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                    {project.lastRun}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(project.status)}
                  </td>

                  {/* Assigned Agent */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {project.assignedAgent}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onRunProject?.(project.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Run Playwright Suite"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Run
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        title="View Full Report"
                      >
                        <FileText className="h-3 w-3" />
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer link to Projects */}
      <div className="flex items-center justify-between p-4 bg-slate-50/50 border-t border-slate-200/80 text-xs">
        <span className="text-slate-500 font-medium">
          Showing {filteredProjects.length} of {RECENT_PROJECTS.length} monitored target environments
        </span>
        <button className="font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
          View All Monitored Projects →
        </button>
      </div>
    </div>
  );
}
