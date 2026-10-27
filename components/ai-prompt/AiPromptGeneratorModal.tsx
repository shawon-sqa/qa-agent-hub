"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Terminal,
  Bot,
  Layers,
  Globe,
  SlidersHorizontal,
  Compass,
  PlayCircle,
  Network,
  ShieldAlert,
  Zap,
  Eye,
  Sliders,
  Database,
  Smartphone,
  Flame,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  QaPromptDomainId,
  PromptContextData,
  QA_PROMPT_DOMAINS,
} from "@/types/ai-prompt";
import { synthesizeQaPrompt } from "@/lib/ai-prompt/promptSynthesisEngine";

interface AiPromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: PromptContextData;
}

export function AiPromptGeneratorModal({
  isOpen,
  onClose,
  context,
}: AiPromptGeneratorModalProps) {
  const [selectedDomain, setSelectedDomain] = useState<QaPromptDomainId>("playwright_e2e");
  const [selectedModel, setSelectedModel] = useState("Claude 3.5 Sonnet / Gemini 1.5 Pro");
  const [copied, setCopied] = useState(false);

  // Generate prompt dynamically
  const generatedPrompt = useMemo(() => {
    return synthesizeQaPrompt(selectedDomain, context, {
      modelTarget: selectedModel,
      strictAntiFabrication: true,
    });
  }, [selectedDomain, context, selectedModel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const domainName = (context.domain || "target").replace(/[^a-z0-9]/gi, "-");
    link.href = url;
    link.setAttribute("download", `ai-qa-prompt-${selectedDomain}-${domainName}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentDomainMeta = QA_PROMPT_DOMAINS.find((d) => d.id === selectedDomain);

  const getDomainIcon = (id: QaPromptDomainId) => {
    switch (id) {
      case "exploratory":
        return <Compass className="h-4 w-4" />;
      case "playwright_e2e":
        return <PlayCircle className="h-4 w-4 text-emerald-400" />;
      case "api_testing":
        return <Network className="h-4 w-4 text-cyan-400" />;
      case "security_owasp":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      case "performance_k6":
        return <Zap className="h-4 w-4 text-amber-400" />;
      case "accessibility_wcag":
        return <Eye className="h-4 w-4 text-indigo-400" />;
      case "boundary_edge":
        return <Sliders className="h-4 w-4 text-purple-400" />;
      case "database_integrity":
        return <Database className="h-4 w-4 text-blue-400" />;
      case "mobile_responsive":
        return <Smartphone className="h-4 w-4 text-teal-400" />;
      case "negative_chaos":
        return <Flame className="h-4 w-4 text-orange-400" />;
      case "compliance_audit":
        return <FileCheck className="h-4 w-4 text-yellow-400" />;
      case "regression_architecture":
        return <Layers className="h-4 w-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col h-[92vh] w-full max-w-5xl rounded-3xl bg-[#0B132B] text-slate-100 shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0A1128]/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  AI QA Prompt Generator Workspace
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  12 QA Domains
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dynamic context injection for <span className="text-cyan-300 font-semibold">{context.projectName || context.domain}</span> ({context.targetUrl || context.domain}).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Left Domain Selector, Right Prompt Output */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row min-h-0">
          {/* Left Column: 12 QA Domains List */}
          <div className="w-full md:w-80 border-r border-slate-800/80 bg-[#0A1128]/50 flex flex-col overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select QA Domain ({QA_PROMPT_DOMAINS.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
              {QA_PROMPT_DOMAINS.map((domain) => {
                const isSelected = domain.id === selectedDomain;
                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white border border-blue-500/40 shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getDomainIcon(domain.id)}</div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold block truncate">{domain.title}</span>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {domain.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Model Target Selector Footer */}
            <div className="p-3 border-t border-slate-800/80 bg-[#0B132B]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target Model Format
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden"
              >
                <option value="Claude 3.5 Sonnet / Gemini 1.5 Pro">Claude 3.5 Sonnet / Gemini 1.5 Pro</option>
                <option value="GPT-4o / ChatGPT Plus">GPT-4o / ChatGPT Plus</option>
                <option value="DeepSeek V3 / R1 Reasoner">DeepSeek V3 / R1 Reasoner</option>
                <option value="Local Ollama / Llama 3.3">Local Ollama / Llama 3.3</option>
              </select>
            </div>
          </div>

          {/* Right Column: Prompt Preview & Actions */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0B132B] min-h-0">
            {/* Top Bar with Context Pills */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0A1128]/40 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {getDomainIcon(selectedDomain)}
                  <span>{currentDomainMeta?.title}</span>
                </span>
                <span className="text-[11px] text-slate-400">|</span>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-sm">
                  {context.businessType || "Web Application"}
                </span>
                {context.requirements && (
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-sm">
                    {context.requirements.length} Reqs Injected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  title="Download prompt as Markdown file (.md)"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Prompt Text Viewport */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-xs leading-relaxed text-slate-200 select-text whitespace-pre-wrap selection:bg-blue-600 selection:text-white scrollbar-thin scrollbar-thumb-slate-800">
              {generatedPrompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
