"use client";

import React, { useState } from "react";
import {
  Play,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Key,
  ShieldCheck,
  Check,
  Code,
  Sliders,
  Send,
  Braces,
} from "lucide-react";
import {
  ApiRequestItem,
  HttpMethod,
  ApiHeader,
  ApiQueryParam,
  ApiAssertion,
  ApiEnvironmentVariable,
} from "@/types/api-testing";

interface ApiRequestBuilderProps {
  request: ApiRequestItem;
  onRequestChange: (updated: ApiRequestItem) => void;
  variables: ApiEnvironmentVariable[];
  onVariablesChange: (updated: ApiEnvironmentVariable[]) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ApiRequestBuilder({
  request,
  onRequestChange,
  variables,
  onVariablesChange,
  onSend,
  isLoading,
}: ApiRequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<"params" | "headers" | "body" | "assertions" | "env">("params");
  const [jsonFormatError, setJsonFormatError] = useState<string | null>(null);

  const methodColors: Record<HttpMethod, string> = {
    GET: "bg-emerald-600 text-white",
    POST: "bg-blue-600 text-white",
    PUT: "bg-amber-600 text-white",
    PATCH: "bg-purple-600 text-white",
    DELETE: "bg-rose-600 text-white",
    OPTIONS: "bg-slate-600 text-white",
    HEAD: "bg-slate-600 text-white",
  };

  // Header Handlers
  const handleAddHeader = () => {
    const updated: ApiHeader[] = [
      ...request.headers,
      { id: `h_${Date.now()}`, key: "", value: "", enabled: true },
    ];
    onRequestChange({ ...request, headers: updated });
  };

  const handleHeaderChange = (index: number, field: "key" | "value" | "enabled", val: string | boolean) => {
    const updated = [...request.headers];
    updated[index] = { ...updated[index], [field]: val };
    onRequestChange({ ...request, headers: updated });
  };

  const handleRemoveHeader = (index: number) => {
    const updated = request.headers.filter((_, i) => i !== index);
    onRequestChange({ ...request, headers: updated });
  };

  // Param Handlers
  const handleAddParam = () => {
    const updated: ApiQueryParam[] = [
      ...request.params,
      { id: `p_${Date.now()}`, key: "", value: "", enabled: true },
    ];
    onRequestChange({ ...request, params: updated });
  };

  const handleParamChange = (index: number, field: "key" | "value" | "enabled", val: string | boolean) => {
    const updated = [...request.params];
    updated[index] = { ...updated[index], [field]: val };
    onRequestChange({ ...request, params: updated });
  };

  const handleRemoveParam = (index: number) => {
    const updated = request.params.filter((_, i) => i !== index);
    onRequestChange({ ...request, params: updated });
  };

  // Assertion Handlers
  const handleAddAssertion = (type: ApiAssertion["type"]) => {
    const newAssert: ApiAssertion = {
      id: `a_${Date.now()}`,
      type,
      operator: type === "response_time" ? "less_than" : "equals",
      expected: type === "status_code" ? "200" : type === "response_time" ? "500" : "application/json",
    };
    onRequestChange({ ...request, assertions: [...request.assertions, newAssert] });
  };

  const handleAssertionChange = (index: number, field: keyof ApiAssertion, val: string) => {
    const updated = [...request.assertions];
    updated[index] = { ...updated[index], [field]: val };
    onRequestChange({ ...request, assertions: updated });
  };

  const handleRemoveAssertion = (index: number) => {
    const updated = request.assertions.filter((_, i) => i !== index);
    onRequestChange({ ...request, assertions: updated });
  };

  // Environment Variable Handlers
  const handleAddVariable = () => {
    onVariablesChange([
      ...variables,
      { id: `env_${Date.now()}`, key: "newKey", value: "value" },
    ]);
  };

  const handleVariableChange = (index: number, key: string, value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], key, value };
    onVariablesChange(updated);
  };

  const handleRemoveVariable = (index: number) => {
    const updated = variables.filter((_, i) => i !== index);
    onVariablesChange(updated);
  };

  const formatJsonBody = () => {
    try {
      if (!request.bodyContent.trim()) return;
      const parsed = JSON.parse(request.bodyContent);
      const formatted = JSON.stringify(parsed, null, 2);
      onRequestChange({ ...request, bodyContent: formatted });
      setJsonFormatError(null);
    } catch (err) {
      setJsonFormatError((err as Error).message);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Top Method & URL Input Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          {/* Method Selector */}
          <select
            value={request.method}
            onChange={(e) => onRequestChange({ ...request, method: e.target.value as HttpMethod })}
            className={`font-black text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono shadow-2xs focus:outline-none cursor-pointer uppercase ${
              methodColors[request.method]
            }`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="OPTIONS">OPTIONS</option>
            <option value="HEAD">HEAD</option>
          </select>

          {/* URL Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={request.url}
              onChange={(e) => onRequestChange({ ...request, url: e.target.value })}
              placeholder="https://api.example.com/v1/resource or {{baseUrl}}/api/v1/..."
              className="w-full text-xs font-mono font-medium px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Send Request Button */}
          <button
            onClick={onSend}
            disabled={isLoading || !request.url.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Send</span>
          </button>
        </div>

        {/* Request Title & Module info */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{request.name}</span>
            <span>•</span>
            <span className="text-slate-400">Module: {request.module}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Environment tags like <code className="text-blue-600 font-bold">{"{{baseUrl}}"}</code> are interpolated before execution
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab("params")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "params"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Query Params ({request.params.filter((p) => p.enabled).length})
        </button>

        <button
          onClick={() => setActiveTab("headers")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "headers"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Headers ({request.headers.filter((h) => h.enabled).length})
        </button>

        <button
          onClick={() => setActiveTab("body")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "body"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Body {request.bodyType !== "none" && "(JSON)"}
        </button>

        <button
          onClick={() => setActiveTab("assertions")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "assertions"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Assertions ({request.assertions.length})
        </button>

        <button
          onClick={() => setActiveTab("env")}
          className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "env"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent hover:text-slate-900"
          }`}
        >
          Env Variables ({variables.length})
        </button>
      </div>

      {/* Sub-Tab Panels */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[480px]">
        {/* PARAMS */}
        {activeTab === "params" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">URL Query Parameters</span>
              <button
                onClick={handleAddParam}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Param
              </button>
            </div>

            <div className="space-y-2">
              {request.params.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => handleParamChange(idx, "enabled", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={p.key}
                    onChange={(e) => handleParamChange(idx, "key", e.target.value)}
                    placeholder="Key (e.g. limit)"
                    className="w-1/3 text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={p.value}
                    onChange={(e) => handleParamChange(idx, "value", e.target.value)}
                    placeholder="Value (e.g. 10)"
                    className="flex-1 text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    onClick={() => handleRemoveParam(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {request.params.length === 0 && (
                <p className="text-xs text-slate-400 italic">No query parameters defined.</p>
              )}
            </div>
          </div>
        )}

        {/* HEADERS */}
        {activeTab === "headers" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">HTTP Request Headers</span>
              <button
                onClick={handleAddHeader}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Header
              </button>
            </div>

            <div className="space-y-2">
              {request.headers.map((h, idx) => (
                <div key={h.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => handleHeaderChange(idx, "enabled", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => handleHeaderChange(idx, "key", e.target.value)}
                    placeholder="Header Key (e.g. Authorization)"
                    className="w-1/3 text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => handleHeaderChange(idx, "value", e.target.value)}
                    placeholder="Value (e.g. Bearer {{authToken}})"
                    className="flex-1 text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    onClick={() => handleRemoveHeader(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {request.headers.length === 0 && (
                <p className="text-xs text-slate-400 italic">No custom headers defined.</p>
              )}
            </div>
          </div>
        )}

        {/* BODY */}
        {activeTab === "body" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Body Type:</span>
                <select
                  value={request.bodyType}
                  onChange={(e) =>
                    onRequestChange({
                      ...request,
                      bodyType: e.target.value as ApiRequestItem["bodyType"],
                    })
                  }
                  className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="none">none</option>
                  <option value="json">JSON (application/json)</option>
                  <option value="raw">raw text</option>
                </select>
              </div>

              {request.bodyType === "json" && (
                <button
                  onClick={formatJsonBody}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Braces className="h-3.5 w-3.5" /> Format JSON
                </button>
              )}
            </div>

            {request.bodyType !== "none" ? (
              <div>
                <textarea
                  rows={10}
                  value={request.bodyContent}
                  onChange={(e) => onRequestChange({ ...request, bodyContent: e.target.value })}
                  placeholder='{\n  "key": "value"\n}'
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {jsonFormatError && (
                  <p className="text-xs text-rose-600 mt-1">{jsonFormatError}</p>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                This request does not have a body. Change body type to JSON to send a payload.
              </div>
            )}
          </div>
        )}

        {/* ASSERTIONS */}
        {activeTab === "assertions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Test Verification Assertions</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddAssertion("status_code")}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Status Code
                </button>
                <button
                  onClick={() => handleAddAssertion("response_time")}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Time Threshold
                </button>
                <button
                  onClick={() => handleAddAssertion("content_type")}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  + Content-Type
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {request.assertions.map((a, idx) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200">
                      {a.type.replace("_", " ")}
                    </span>
                    <span className="text-slate-500 font-semibold">{a.operator.replace("_", " ")}</span>
                    <input
                      type="text"
                      value={a.expected}
                      onChange={(e) => handleAssertionChange(idx, "expected", e.target.value)}
                      className="text-xs font-mono px-3 py-1 rounded-xl border border-slate-200 bg-white text-slate-800 w-32"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveAssertion(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {request.assertions.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  No assertions configured. Add a status code or response time check above.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ENV VARIABLES */}
        {activeTab === "env" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">Active Environment Variables</span>
                <p className="text-[11px] text-slate-400">
                  Use in URLs or headers as <code className="text-blue-600 font-bold">{"{{variableKey}}"}</code>
                </p>
              </div>
              <button
                onClick={handleAddVariable}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Variable
              </button>
            </div>

            <div className="space-y-2">
              {variables.map((v, idx) => (
                <div key={v.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.key}
                    onChange={(e) => handleVariableChange(idx, e.target.value, v.value)}
                    placeholder="Variable Key (e.g. baseUrl)"
                    className="w-1/3 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-blue-700"
                  />
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => handleVariableChange(idx, v.key, e.target.value)}
                    placeholder="Value (e.g. https://api.mybank.com)"
                    className="flex-1 text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    onClick={() => handleRemoveVariable(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
