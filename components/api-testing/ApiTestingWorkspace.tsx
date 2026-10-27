"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Network,
  Plus,
  Search,
  Filter,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  ApiRequestItem,
  ApiEnvironmentVariable,
  ApiResponse,
  HttpMethod,
} from "@/types/api-testing";
import {
  getDefaultApiCollections,
  getDefaultEnvironmentVariables,
  executeApiRequest,
} from "@/lib/api-testing/apiTestingService";
import { ApiRequestBuilder } from "./ApiRequestBuilder";
import { ApiResponseViewer } from "./ApiResponseViewer";

export function ApiTestingWorkspace() {
  const { activeProjectId, activeProject } = useActiveProject();

  const [requests, setRequests] = useState<ApiRequestItem[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string>("");
  const [variables, setVariables] = useState<ApiEnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    const defaultVars = getDefaultEnvironmentVariables(activeProject);
    const defaultReqs = getDefaultApiCollections(activeProject);
    setVariables(defaultVars);
    setRequests(defaultReqs);
    if (defaultReqs.length > 0) {
      setActiveRequestId(defaultReqs[0].id);
    }
  }, [activeProjectId]);

  const activeRequest = useMemo(() => {
    return requests.find((r) => r.id === activeRequestId) || requests[0] || null;
  }, [requests, activeRequestId]);

  const methodColors: Record<HttpMethod, string> = {
    GET: "text-emerald-700 bg-emerald-50 border-emerald-200",
    POST: "text-blue-700 bg-blue-50 border-blue-200",
    PUT: "text-amber-700 bg-amber-50 border-amber-200",
    PATCH: "text-purple-700 bg-purple-50 border-purple-200",
    DELETE: "text-rose-700 bg-rose-50 border-rose-200",
    OPTIONS: "text-slate-700 bg-slate-50 border-slate-200",
    HEAD: "text-slate-700 bg-slate-50 border-slate-200",
  };

  // Group requests by module
  const groupedRequests = useMemo(() => {
    const map: Record<string, ApiRequestItem[]> = {};
    requests.forEach((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q);
        if (!match) return;
      }
      if (!map[r.module]) map[r.module] = [];
      map[r.module].push(r);
    });
    return map;
  }, [requests, searchQuery]);

  // Execute request
  const handleSendRequest = async () => {
    if (!activeRequest) return;
    setIsLoading(true);
    try {
      const resp = await executeApiRequest(activeRequest, variables);
      // update active request with last response
      const updated = requests.map((r) =>
        r.id === activeRequest.id ? { ...r, lastResponse: resp } : r
      );
      setRequests(updated);
      notify(`HTTP ${resp.statusCode} received in ${resp.timeMs}ms`);
    } catch (err) {
      notify(`Request execution failed: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewRequest = () => {
    const newReq: ApiRequestItem = {
      id: `req_${Date.now()}`,
      projectId: activeProject.id,
      name: "New API Endpoint",
      module: "Custom Endpoints",
      method: "GET",
      url: "{{baseUrl}}/api/v1/endpoint",
      headers: [{ id: `h_${Date.now()}`, key: "Accept", value: "application/json", enabled: true }],
      params: [],
      bodyType: "none",
      bodyContent: "",
      assertions: [
        { id: `a_${Date.now()}`, type: "status_code", expected: "200", operator: "equals" },
      ],
    };
    setRequests([...requests, newReq]);
    setActiveRequestId(newReq.id);
  };

  const handleRequestChange = (updated: ApiRequestItem) => {
    setRequests(requests.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-indigo-50/20 to-blue-50/30 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50">
                API Automation & Contract Testing
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Project: {activeProject.name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-medium text-slate-500">
                Gateway: https://{activeProject.domain}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              API Testing & Assertion Workspace
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Construct REST requests, interpolate dynamic environment variables, execute contract checks,
              and validate status codes, response times, and payload schemas via live server runner.
            </p>
          </div>

          <button
            onClick={handleCreateNewRequest}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start lg:self-center"
          >
            <Plus className="h-4 w-4" /> New Request
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Collections Sidebar, Right Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Requests Collection */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network className="h-4 w-4 text-blue-600" />
              API Collections ({requests.length})
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {Object.keys(groupedRequests).length} Modules
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Groups List */}
          <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
            {Object.entries(groupedRequests).map(([modName, items]) => (
              <div key={modName} className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
                  {modName}
                </span>

                <div className="space-y-1">
                  {items.map((item) => {
                    const isSelected = item.id === activeRequestId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveRequestId(item.id)}
                        className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 shadow-2xs"
                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                              methodColors[item.method]
                            }`}
                          >
                            {item.method}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.name}
                          </span>
                        </div>

                        {item.lastResponse && (
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              item.lastResponse.statusCode < 300
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area: Request Builder & Response Viewer */}
        <div className="lg:col-span-8 space-y-6">
          {activeRequest ? (
            <>
              {/* Request Builder */}
              <ApiRequestBuilder
                request={activeRequest}
                onRequestChange={handleRequestChange}
                variables={variables}
                onVariablesChange={setVariables}
                onSend={handleSendRequest}
                isLoading={isLoading}
              />

              {/* Response Viewer */}
              <ApiResponseViewer
                response={activeRequest.lastResponse || null}
                isLoading={isLoading}
              />
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              Select or create a request to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
