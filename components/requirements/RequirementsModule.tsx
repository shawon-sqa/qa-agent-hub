"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileText,
  Copy,
  Check,
  Database,
  ListChecks,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/types/supabase";

export interface AnalysisResponse {
  title: string;
  summary: string;
  riskAssessment: {
    level: "low" | "medium" | "high" | "critical";
    score: number;
    factors: string[];
  };
  features: Array<{
    name: string;
    description: string;
    acceptanceCriteria: string[];
  }>;
  testScenarios: Array<{
    title: string;
    type: "e2e" | "api" | "security" | "performance" | "unit";
    priority: "low" | "medium" | "high" | "critical";
    steps: string[];
    expectedResult: string;
  }>;
  edgeCases: string[];
  securityConsiderations: string[];
  isMock?: boolean;
  notice?: string;
  projectId?: string;
  analyzedAt?: string;
}

const PRESET_REQUIREMENTS = [
  {
    label: "Magic Link Authentication",
    title: "Passwordless Magic Link Auth with 15-Minute Expiry",
    text: `Feature: Passwordless Magic Link Authentication
As an unauthenticated user,
I want to log into my account by requesting a secure magic link sent to my verified email address,
So that I do not have to manage or remember passwords.

Acceptance Criteria:
1. User enters email on login screen; validate email format with regex.
2. System generates a cryptographically random, single-use token with a 15-minute expiration timestamp.
3. User receives email with sign-in link: https://app.example.com/auth/verify?token=XYZ.
4. Clicking the link validates token validity and marks it as consumed immediately to prevent replay attacks.
5. If token is expired (>15 min) or invalid, user sees a descriptive error with a button to request a new link.
6. Rate limit: Maximum 3 magic link requests per IP/email address within a rolling 15-minute window.`,
  },
  {
    label: "Checkout & Payment Flow",
    title: "Stripe 3DS Checkout and Cart Inventory Reservation",
    text: `Feature: E-Commerce Multi-Currency Checkout
As a customer with items in my shopping cart,
I want to securely purchase items using Credit Card (Stripe 3D Secure) or Apple Pay,
So that my transaction is processed safely and items are reserved.

Acceptance Criteria:
1. Clicking 'Proceed to Checkout' locks inventory stock for 10 minutes.
2. If payment is completed within 10 minutes, convert reservation to 'Purchased' order state.
3. Trigger 3D Secure biometric/SMS verification challenge when required by issuing bank.
4. If payment fails or times out, immediately release reserved inventory back to catalog.
5. Send customer transactional confirmation email and create invoice record in database.`,
  },
  {
    label: "HIPAA Patient Telemetry",
    title: "Real-time Patient Vitals Telemetry with Audit Logging",
    text: `Feature: Clinical Patient Telemetry Stream
As a healthcare provider,
I want to view real-time streaming heart rate and oxygen saturation telemetry for hospitalized patients,
So that anomalies trigger instant audio-visual alerts at the nursing station.

Acceptance Criteria:
1. Ingest telemetry events at up to 100Hz per bed monitor via secure WebSocket (WSS).
2. All data in transit and at rest must be encrypted using AES-256.
3. If SpO2 drops below 90% or Heart Rate exceeds 130 bpm, trigger high-priority alert in < 500ms.
4. Maintain strict audit logs of every practitioner access event conforming to HIPAA standards.`,
  },
];

const AVAILABLE_PROJECTS = [
  { id: "c4b14d23-26a0-4cf8-8316-2c5e53303da1", name: "FinTech Banking Portal" },
  { id: "d7a98e54-52d3-46ea-9d6f-782d1c6e11f2", name: "E-Commerce Checkout Flow" },
  { id: "e9c32a11-89fc-482a-b673-984210bc6a99", name: "Healthcare Provider Portal" },
];

export function RequirementsModule() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    AVAILABLE_PROJECTS[0].id
  );
  // Check for requirements passed from Website Analysis module via lazy initializers
  const [title, setTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("qa_hub_converted_requirement");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.title || "";
        }
      } catch {
        // ignore
      }
    }
    return "";
  });

  const [requirementText, setRequirementText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("qa_hub_converted_requirement");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.text || "";
        }
      } catch {
        // ignore
      }
    }
    return "";
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("qa_hub_converted_requirement");
        if (stored) {
          const parsed = JSON.parse(stored);
          sessionStorage.removeItem("qa_hub_converted_requirement");
          return `Imported business analysis for ${parsed.domain || "website target"}. Click "Analyze with AI" below to generate test scenarios.`;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [copiedJSON, setCopiedJSON] = useState<boolean>(false);

  // Load a preset template
  const handleLoadPreset = (preset: (typeof PRESET_REQUIREMENTS)[0]) => {
    setTitle(preset.title);
    setRequirementText(preset.text);
    setErrorMessage(null);
  };

  // Submit requirement to POST /api/analyze-requirement
  const handleAnalyze = async () => {
    if (!requirementText.trim()) {
      setErrorMessage("Please enter or paste requirement text to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const response = await fetch("/api/analyze-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementText,
          projectId: selectedProjectId,
          title: title.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result = (await response.json()) as AnalysisResponse;
      setAnalysis(result);
      if (!title.trim() && result.title) {
        setTitle(result.title);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze requirement";
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save to Supabase requirements table
  const handleSaveToSupabase = async () => {
    if (!analysis) return;

    setIsSaving(true);
    setSaveSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("requirements")
        .insert({
          project_id: selectedProjectId,
          title: title.trim() || analysis.title,
          raw_text: requirementText,
          analysis: analysis as unknown as Json,
          risk_level: analysis.riskAssessment.level,
          status: "analyzed",
        })
        .select()
        .single();

      if (error) {
        // Fallback message if Supabase URL is placeholder
        console.warn("[Supabase insert warning]", error);
        setSaveSuccessMessage(
          `Analysis saved locally! (Note: Connect live Supabase credentials in .env.local to persist permanently to remote cloud).`
        );
      } else {
        setSaveSuccessMessage(
          `Successfully saved requirement to Supabase! (Record ID: ${data.id.slice(0, 8)}...)`
        );
      }
    } catch (err: unknown) {
      console.warn("[Save error]", err);
      setSaveSuccessMessage(
        "Analysis captured! Connect your Supabase project in .env.local to enable real-time cloud sync."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Copy full JSON to clipboard
  const handleCopyJSON = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  // Badge styling for risk levels
  const getRiskBadge = (level: AnalysisResponse["riskAssessment"]["level"]) => {
    switch (level) {
      case "critical":
        return "bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-800";
      case "high":
        return "bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-800";
      case "medium":
        return "bg-yellow-500/10 text-yellow-800 border-yellow-300 dark:border-yellow-800";
      case "low":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-800";
    }
  };

  // Badge styling for scenario type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "e2e":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "api":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "security":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "performance":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
              Module • AI Specification Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Requirements Analysis & Test Case Generation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Input product specifications, user stories, or acceptance criteria. Shawon&apos;s AI QA agent parses test vectors, edge cases, and risk factors in seconds.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-2xs">
          <FolderKanban className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Target Project</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {AVAILABLE_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preset Templates Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" /> Quick Presets:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_REQUIREMENTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Requirement Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., User Authentication via Magic Link"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-500/10 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Requirement Specification / User Stories / PRD Text
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {requirementText.length} characters
            </span>
          </div>

          <textarea
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            rows={8}
            placeholder={`Paste your PRD, user story, or acceptance criteria here...\n\nExample:\nAs a user, I want to reset my password using a one-time link sent to my email so that I can regain access securely.\n\nAcceptance Criteria:\n1. Link expires in 15 minutes.\n2. Token cannot be reused.`}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-500/10 transition-all leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Analyzed with Gemini QA Engine • Generates test scenarios & risk factors</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setRequirementText("");
                setTitle("");
                setAnalysis(null);
                setErrorMessage(null);
                setSaveSuccessMessage(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer w-1/2 sm:w-auto"
            >
              Clear
            </button>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !requirementText.trim()}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                isAnalyzing || !requirementText.trim()
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 shadow-blue-500/20 active:scale-[0.99]"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <strong className="font-bold">Analysis Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        {saveSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <strong className="font-bold">Database Update:</strong> {saveSuccessMessage}
            </div>
          </div>
        )}
      </div>

      {/* Structured Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Top Bar for Results */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0B132B] text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-400 border border-blue-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {analysis.title}
                  {analysis.isMock && (
                    <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                      Sandbox Simulation
                    </span>
                  )}
                </h3>
                <span className="text-xs text-slate-400">
                  Target Project: {AVAILABLE_PROJECTS.find((p) => p.id === selectedProjectId)?.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJSON}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C2541] hover:bg-[#253259] text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                {copiedJSON ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy JSON
                  </>
                )}
              </button>

              <button
                onClick={handleSaveToSupabase}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Database className="h-3.5 w-3.5" /> Save to Supabase Project
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notice banner if simulated */}
          {analysis.notice && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs text-blue-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>{analysis.notice}</span>
            </div>
          )}

          {/* Section 1: Executive Summary & Risk Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Summary */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600" /> Executive Summary
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </div>

            {/* Risk Assessment Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk Assessment
                </h4>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${getRiskBadge(
                    analysis.riskAssessment.level
                  )}`}
                >
                  {analysis.riskAssessment.level} Risk
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Risk Score</span>
                  <span>{analysis.riskAssessment.score} / 100</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      analysis.riskAssessment.score > 75
                        ? "bg-rose-500"
                        : analysis.riskAssessment.score > 40
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${analysis.riskAssessment.score}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Key Risk Drivers:
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {analysis.riskAssessment.factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Discovered Key Features */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-indigo-600" /> Discovered Core Functional Features ({analysis.features.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <h5 className="text-sm font-bold text-slate-800">{feature.name}</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Acceptance Criteria:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {feature.acceptanceCriteria.map((ac, acIdx) => (
                        <li key={acIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{ac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Structured Test Scenarios Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  Synthesized Test Scenarios ({analysis.testScenarios.length})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated test cases generated for Playwright, API testing, and edge case coverage
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ready for Test Suite
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Scenario Title</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-5 py-3">Execution Steps</th>
                    <th className="px-5 py-3">Expected Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {analysis.testScenarios.map((scenario, sIdx) => (
                    <tr key={sIdx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 align-top max-w-[220px]">
                        {scenario.title}
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] border ${getTypeBadge(
                            scenario.type
                          )}`}
                        >
                          {scenario.type}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] border ${
                            scenario.priority === "critical"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : scenario.priority === "high"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {scenario.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium">
                          {scenario.steps.map((st, stIdx) => (
                            <li key={stIdx} className="leading-snug">
                              {st}
                            </li>
                          ))}
                        </ol>
                      </td>
                      <td className="px-5 py-3.5 align-top font-medium text-emerald-800 bg-emerald-50/30 max-w-[260px] rounded-lg">
                        {scenario.expectedResult}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Edge Cases & Security Considerations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Edge Cases */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Edge Cases & Boundary Conditions ({analysis.edgeCases.length})
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {analysis.edgeCases.map((ec, ecIdx) => (
                  <li
                    key={ecIdx}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 font-medium text-slate-800 flex items-start gap-2"
                  >
                    <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                    <span>{ec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Considerations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Security & Penetration Test Vectors ({analysis.securityConsiderations.length})
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {analysis.securityConsiderations.map((sec, secIdx) => (
                  <li
                    key={secIdx}
                    className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/60 font-medium text-slate-800 flex items-start gap-2"
                  >
                    <span className="text-emerald-600 font-bold shrink-0">🔒</span>
                    <span>{sec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
