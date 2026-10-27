"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Workflow,
  Sparkles,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  CheckSquare,
  FileCheck2,
  Edit3,
  Trash2,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Wrench,
  CheckCircle,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";
import { supabase } from "@/lib/supabase/client";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  BusinessFlow,
  FlowStep,
  FlowStepType,
  DecisionBranch,
} from "@/types/business-flows";
import { TenSectionAnalysis, VerificationStatus } from "@/types/website-analysis";
import {
  validateBusinessFlow,
  generateBusinessFlowsFromAnalysis,
  generateDomainTailoredBusinessFlows,
} from "@/lib/business-flows/flowEngine";
import { Json } from "@/types/supabase";

export default function BusinessFlowsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const { activeProjectId, activeProject } = useActiveProject();

  const [flows, setFlows] = useState<BusinessFlow[]>(() => {
    return generateDomainTailoredBusinessFlows(activeProject);
  });
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(() => {
    const init = generateDomainTailoredBusinessFlows(activeProject);
    return init[0]?.id || null;
  });
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [isNewStep, setIsNewStep] = useState(false);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchStepId, setBranchStepId] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState<DecisionBranch>({
    id: "",
    condition: "",
    targetStepId: null,
    outcomeType: "failure",
    description: "",
  });

  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [newFlowTitle, setNewFlowTitle] = useState("");
  const [newFlowCategory, setNewFlowCategory] = useState<BusinessFlow["category"]>("User Journey");
  const [newFlowDescription, setNewFlowDescription] = useState("");

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    setStatusNotification({ type, message });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  // 1. Fetch flows for active project from Supabase or fallback
  const fetchFlows = async () => {
    try {
      setLoading(true);
      let loadedFlows: BusinessFlow[] = [];

      try {
        const { data, error } = await supabase
          .from("business_flows")
          .select("*")
          .eq("project_id", activeProjectId)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          loadedFlows = data.map((row) => ({
            id: row.id,
            projectId: row.project_id,
            flowCode: row.flow_code,
            title: row.title,
            description: row.description || "",
            category: (row.category as BusinessFlow["category"]) || "User Journey",
            status: row.status,
            verificationStatus: "Verified",
            startPoint: row.start_point,
            endPoint: row.end_point,
            steps: Array.isArray(row.steps) ? (row.steps as unknown as FlowStep[]) : [],
            validation: (row.validation as unknown as BusinessFlow["validation"]) || {
              hasStartNode: true,
              hasTerminalNode: true,
              unhandledFailureBranches: [],
              orphanedSteps: [],
              healthScore: 100,
              warnings: [],
              recommendations: [],
            },
            traceability: (row.traceability as unknown as BusinessFlow["traceability"]) || {
              sourceEvidence: "Supabase Record",
              linkedRequirements: [],
              linkedTestCases: [],
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase query for business_flows skipped:", err);
      }

      // Check localStorage fallback for active project
      if (loadedFlows.length === 0 && typeof window !== "undefined") {
        try {
          const localKey = `qa_hub_flows_${activeProjectId}`;
          const localData = localStorage.getItem(localKey);
          if (localData) {
            loadedFlows = JSON.parse(localData);
          }
        } catch {}
      }

      // If no flows stored yet, generate domain-tailored default flows
      if (loadedFlows.length === 0) {
        loadedFlows = generateDomainTailoredBusinessFlows(activeProject);
      }

      // Ensure validation is fresh
      loadedFlows = loadedFlows.map((f) => ({
        ...f,
        validation: validateBusinessFlow(f),
      }));

      setFlows(loadedFlows);
      if (loadedFlows.length > 0) {
        setSelectedFlowId(loadedFlows[0].id);
      } else {
        setSelectedFlowId(null);
      }
    } catch (err) {
      console.error("Error loading flows:", err);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [activeProjectId]);

  // Selected flow
  const currentFlow = useMemo(() => {
    return flows.find((f) => f.id === selectedFlowId) || flows[0] || null;
  }, [flows, selectedFlowId]);

  // Persist flows helper
  const persistFlows = async (updatedFlows: BusinessFlow[]) => {
    setFlows(updatedFlows);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`qa_hub_flows_${activeProjectId}`, JSON.stringify(updatedFlows));
      } catch {}
    }

    // Try saving to Supabase if table is available
    if (currentFlow) {
      const target = updatedFlows.find((f) => f.id === currentFlow.id);
      if (target) {
        try {
          await supabase.from("business_flows").upsert({
            id: target.id.includes("flow_") ? undefined : target.id,
            project_id: activeProjectId,
            flow_code: target.flowCode,
            title: target.title,
            description: target.description,
            category: target.category,
            status: target.status,
            start_point: target.startPoint,
            end_point: target.endPoint,
            steps: target.steps as unknown as Json,
            validation: target.validation as unknown as Json,
            traceability: target.traceability as unknown as Json,
          });
        } catch {}
      }
    }
  };

  // 2. Action: Generate Flows from Website Analysis
  const handleGenerateFromAnalysis = async () => {
    try {
      setIsGenerating(true);
      notify(`Synthesizing business flows from website analysis for "${activeProject.name}"...`, "info");

      let tenSection: TenSectionAnalysis | null = null;
      try {
        const { data: analyses } = await supabase
          .from("website_analyses")
          .select("business_analysis_report, ten_section_analysis")
          .or(`project_id.eq.${activeProjectId},domain.ilike.%${activeProject.domain}%`)
          .order("created_at", { ascending: false })
          .limit(1);

        if (analyses && analyses.length > 0) {
          const rep = analyses[0].business_analysis_report || analyses[0].ten_section_analysis;
          if (rep && typeof rep === "object" && "section4_featuresAndWorkflows" in rep) {
            tenSection = rep as TenSectionAnalysis;
          }
        }
      } catch {}

      // Fallback to sessionStorage
      if (!tenSection && typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem("qa_hub_last_analysis");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.tenSectionAnalysis) tenSection = parsed.tenSectionAnalysis;
          }
        } catch {}
      }

      const generated = generateBusinessFlowsFromAnalysis(tenSection, activeProject);

      const merged = [...generated, ...flows.filter((f) => !generated.some((g) => g.flowCode === f.flowCode))];
      await persistFlows(merged);
      if (generated.length > 0) {
        setSelectedFlowId(generated[0].id);
      }

      notify(`Generated ${generated.length} business workflows with QA review verification.`, "success");
    } catch (err) {
      console.error("Failed to generate flows:", err);
      notify("Failed to generate flows from analysis.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Action: Auto-Fix Missing Failure Branches
  const handleAutoFixFailureBranches = () => {
    if (!currentFlow) return;

    const updatedSteps = currentFlow.steps.map((step) => {
      if (step.type === "decision" || step.type === "verification") {
        const hasFailure = step.branches?.some((b) => b.outcomeType === "failure");
        if (!hasFailure) {
          const newBranches: DecisionBranch[] = [
            ...(step.branches || []),
            {
              id: `br_${step.id}_fail_fix`,
              condition: "Validation fails, session timeout, or HTTP 4xx/5xx returned",
              targetStepId: "TERMINAL_FAILURE",
              outcomeType: "failure",
              description: "Render inline error notification and keep form state for user retry",
            },
          ];
          return {
            ...step,
            branches: newBranches,
            failurePoints: step.failurePoints?.length
              ? step.failurePoints
              : ["Network latency / server timeout", "Validation threshold exceeded"],
          };
        }
      }
      return step;
    });

    const updatedFlow: BusinessFlow = {
      ...currentFlow,
      steps: updatedSteps,
    };
    updatedFlow.validation = validateBusinessFlow(updatedFlow);

    const updatedList = flows.map((f) => (f.id === currentFlow.id ? updatedFlow : f));
    persistFlows(updatedList);
    notify(`Auto-fixed exception branches on ${currentFlow.flowCode}. Health score updated to ${updatedFlow.validation.healthScore}%.`, "success");
  };

  // Step Operations
  const handleMoveStep = (stepId: string, direction: "up" | "down") => {
    if (!currentFlow) return;
    const index = currentFlow.steps.findIndex((s) => s.id === stepId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === currentFlow.steps.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newSteps = [...currentFlow.steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // Re-index stepNumbers
    newSteps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });

    const updatedFlow: BusinessFlow = {
      ...currentFlow,
      steps: newSteps,
    };
    updatedFlow.validation = validateBusinessFlow(updatedFlow);
    persistFlows(flows.map((f) => (f.id === currentFlow.id ? updatedFlow : f)));
  };

  const handleDeleteStep = (stepId: string) => {
    if (!currentFlow) return;
    if (currentFlow.steps.length <= 1) {
      alert("A workflow must contain at least 1 step.");
      return;
    }
    const newSteps = currentFlow.steps
      .filter((s) => s.id !== stepId)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    const updatedFlow: BusinessFlow = {
      ...currentFlow,
      steps: newSteps,
    };
    updatedFlow.validation = validateBusinessFlow(updatedFlow);
    persistFlows(flows.map((f) => (f.id === currentFlow.id ? updatedFlow : f)));
    notify("Step removed from workflow.", "info");
  };

  const openAddStepModal = () => {
    if (!currentFlow) return;
    const nextNum = currentFlow.steps.length + 1;
    setEditingStep({
      id: `step_${Date.now()}`,
      stepNumber: nextNum,
      title: "",
      type: "action",
      userAction: "",
      systemResponse: "",
      nextStepId: "TERMINAL_SUCCESS",
      linkedRequirementCode: `REQ-BIZ-${String(nextNum).padStart(3, "0")}`,
      linkedTestCaseId: `TC-E2E-${String(nextNum).padStart(3, "0")}`,
    });
    setIsNewStep(true);
    setIsStepModalOpen(true);
  };

  const openEditStepModal = (step: FlowStep) => {
    setEditingStep({ ...step, failurePoints: [...(step.failurePoints || [])] });
    setIsNewStep(false);
    setIsStepModalOpen(true);
  };

  const handleSaveStep = () => {
    if (!currentFlow || !editingStep || !editingStep.title.trim()) {
      alert("Please provide a step title.");
      return;
    }

    let updatedSteps = [...currentFlow.steps];
    if (isNewStep) {
      updatedSteps.push(editingStep);
    } else {
      updatedSteps = updatedSteps.map((s) => (s.id === editingStep.id ? editingStep : s));
    }

    // Re-index numbers
    updatedSteps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });

    const updatedFlow: BusinessFlow = {
      ...currentFlow,
      steps: updatedSteps,
    };
    updatedFlow.validation = validateBusinessFlow(updatedFlow);
    persistFlows(flows.map((f) => (f.id === currentFlow.id ? updatedFlow : f)));
    setIsStepModalOpen(false);
    notify(`Step "${editingStep.title}" saved.`, "success");
  };

  // Decision Branch Operations
  const openAddBranchModal = (stepId: string) => {
    setBranchStepId(stepId);
    setNewBranch({
      id: `br_${Date.now()}`,
      condition: "",
      targetStepId: "TERMINAL_FAILURE",
      outcomeType: "failure",
      description: "",
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = () => {
    if (!currentFlow || !branchStepId || !newBranch.condition.trim()) {
      alert("Please provide a condition for the decision branch.");
      return;
    }

    const updatedSteps = currentFlow.steps.map((step) => {
      if (step.id === branchStepId) {
        const existing = step.branches || [];
        return {
          ...step,
          type: "decision" as FlowStepType,
          branches: [...existing, newBranch],
        };
      }
      return step;
    });

    const updatedFlow: BusinessFlow = {
      ...currentFlow,
      steps: updatedSteps,
    };
    updatedFlow.validation = validateBusinessFlow(updatedFlow);
    persistFlows(flows.map((f) => (f.id === currentFlow.id ? updatedFlow : f)));
    setIsBranchModalOpen(false);
    notify("Decision branch added.", "success");
  };

  const handleDeleteBranch = (stepId: string, branchId: string) => {
    if (!currentFlow) return;
    const updatedSteps = currentFlow.steps.map((step) => {
      if (step.id === stepId && step.branches) {
        return {
          ...step,
          branches: step.branches.filter((b) => b.id !== branchId),
        };
      }
      return step;
    });

    const updatedFlow: BusinessFlow = {
      ...currentFlow,
      steps: updatedSteps,
    };
    updatedFlow.validation = validateBusinessFlow(updatedFlow);
    persistFlows(flows.map((f) => (f.id === currentFlow.id ? updatedFlow : f)));
    notify("Decision branch removed.", "info");
  };

  // Create New Flow
  const handleCreateNewFlow = () => {
    if (!newFlowTitle.trim()) {
      alert("Please provide a title for the business flow.");
      return;
    }

    const nextCode = `FLOW-${String(flows.length + 1).padStart(3, "0")}`;
    const newFlow: BusinessFlow = {
      id: `flow_${Date.now()}`,
      projectId: activeProjectId,
      flowCode: nextCode,
      title: newFlowTitle.trim(),
      description: newFlowDescription.trim() || `Operational workflow for ${activeProject.name}.`,
      category: newFlowCategory,
      status: "draft",
      verificationStatus: "Verified",
      startPoint: `https://${activeProject.domain}`,
      endPoint: "Terminal Success",
      steps: [
        {
          id: `step_1`,
          stepNumber: 1,
          title: "Initial Action",
          type: "action",
          userAction: "User triggers workflow entry point",
          systemResponse: "System verifies input state and renders view",
          nextStepId: "TERMINAL_SUCCESS",
          linkedRequirementCode: "REQ-FUNC-001",
          linkedTestCaseId: "TC-E2E-001",
        },
      ],
      validation: {
        hasStartNode: true,
        hasTerminalNode: true,
        unhandledFailureBranches: [],
        orphanedSteps: [],
        healthScore: 90,
        warnings: [],
        recommendations: [],
      },
      traceability: {
        sourceEvidence: "Manual Business Flow Architecture",
        sourceUrl: `https://${activeProject.domain}`,
        linkedRequirements: ["REQ-FUNC-001"],
        linkedTestCases: ["TC-E2E-001"],
        verifiedAt: new Date().toISOString(),
      },
    };

    newFlow.validation = validateBusinessFlow(newFlow);
    const updated = [newFlow, ...flows];
    persistFlows(updated);
    setSelectedFlowId(newFlow.id);
    setIsNewFlowModalOpen(false);
    setNewFlowTitle("");
    setNewFlowDescription("");
    notify(`Created new business flow "${newFlow.flowCode}".`, "success");
  };

  // Export Flow (Mermaid Diagram / Markdown / JSON)
  const handleExportFlow = () => {
    if (!currentFlow) return;

    // Generate Mermaid flowchart
    let mermaid = `graph TD\n`;
    mermaid += `  Start(["${currentFlow.startPoint}"]) --> Step1\n`;

    currentFlow.steps.forEach((step, idx) => {
      const stepId = `Step${idx + 1}`;
      const titleEscaped = step.title.replace(/"/g, "'");
      if (step.type === "decision") {
        mermaid += `  ${stepId}{"${titleEscaped}"}\n`;
      } else {
        mermaid += `  ${stepId}["${titleEscaped}"]\n`;
      }

      if (step.branches && step.branches.length > 0) {
        step.branches.forEach((b) => {
          const target = b.targetStepId === "TERMINAL_FAILURE" ? "EndFail([Failure / Retry])" : b.targetStepId === "TERMINAL_SUCCESS" ? "EndSuccess([Terminal Success])" : b.targetStepId || "NextStep";
          mermaid += `  ${stepId} -- "${b.condition.slice(0, 25)}" --> ${target}\n`;
        });
      } else if (idx < currentFlow.steps.length - 1) {
        mermaid += `  ${stepId} --> Step${idx + 2}\n`;
      } else {
        mermaid += `  ${stepId} --> EndSuccess(["${currentFlow.endPoint}"])\n`;
      }
    });

    const exportText = `# Business Flow: ${currentFlow.flowCode} - ${currentFlow.title}\n\n` +
      `**Project:** ${activeProject.name} (${activeProject.domain})\n` +
      `**Health Score:** ${currentFlow.validation.healthScore}%\n` +
      `**Start Point:** ${currentFlow.startPoint}\n` +
      `**End Point:** ${currentFlow.endPoint}\n\n` +
      `## Mermaid Workflow Diagram\n\`\`\`mermaid\n${mermaid}\`\`\`\n\n` +
      `## Step-by-Step Specification\n` +
      currentFlow.steps.map((s) => `### Step ${s.stepNumber}: ${s.title} (${s.type})\n- **User Action:** ${s.userAction}\n- **System Response:** ${s.systemResponse}\n${s.failurePoints ? `- **Failure Modes:** ${s.failurePoints.join("; ")}\n` : ""}\n`).join("\n");

    const blob = new Blob([exportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${currentFlow.flowCode.toLowerCase()}-workflow.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Exported ${currentFlow.flowCode} specification with Mermaid flowchart.`, "success");
  };

  const getStepTypeBadge = (type: FlowStepType) => {
    switch (type) {
      case "action":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Action</span>;
      case "decision":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1"><GitBranch className="h-3 w-3" /> Decision</span>;
      case "verification":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verification</span>;
      case "terminal":
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-slate-900 text-white shadow-2xs">Terminal</span>;
      default:
        return <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-slate-100 text-slate-700">Step</span>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeModule="business-flows"
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        {statusNotification && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b animate-in fade-in slide-in-from-top-1 duration-200 ${
              statusNotification.type === "success"
                ? "bg-slate-900 text-emerald-400 border-slate-800"
                : statusNotification.type === "error"
                ? "bg-rose-950 text-rose-300 border-rose-900"
                : "bg-blue-950 text-cyan-300 border-blue-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{statusNotification.message}</span>
            </div>
            <button onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-sm uppercase">
                  Flow Builder & QA Review
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Active Project:
                  <span className="font-semibold text-slate-800">{activeProject.name}</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Business Flows & User Journeys
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Engineer, validate, and simulate end-to-end user workflows with automatic failure-branch detection and test case mapping.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleGenerateFromAnalysis}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Generate from Website Analysis</span>
              </button>

              <button
                onClick={() => setIsNewFlowModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4 text-slate-500" />
                <span>New Flow</span>
              </button>

              <button
                onClick={handleExportFlow}
                disabled={!currentFlow}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Export as Markdown with Mermaid flowchart diagram"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Flow</span>
              </button>
            </div>
          </div>

          {/* Flow Tabs / Selector Cards */}
          {flows.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
              {flows.map((flow) => {
                const isSelected = flow.id === selectedFlowId;
                const score = flow.validation?.healthScore ?? 100;
                return (
                  <button
                    key={flow.id}
                    onClick={() => setSelectedFlowId(flow.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-cyan-300">
                      {flow.flowCode}
                    </span>
                    <span className="font-semibold truncate max-w-[180px]">{flow.title}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        score >= 90
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {score}% Health
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && flows.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-4">
                <Workflow className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Business Flows Configured Yet</h3>
              <p className="text-sm text-slate-600 max-w-md mt-1 mb-5">
                Automatically extract and map complete user journeys directly from the crawled website intelligence for {activeProject.name}.
              </p>
              <button
                onClick={handleGenerateFromAnalysis}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Generate Business Flows from Website Analysis</span>
              </button>
            </div>
          )}

          {/* Flow Workspace Main Layout: Left Canvas / Step Sequence, Right QA Review Panel */}
          {currentFlow && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Interactive Step Builder Canvas (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Flow Overview Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-white">
                          {currentFlow.flowCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {currentFlow.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Architecture
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">{currentFlow.title}</h2>
                      <p className="text-xs text-slate-600 mt-1">{currentFlow.description}</p>
                    </div>

                    <button
                      onClick={openAddStepModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Step</span>
                    </button>
                  </div>

                  {/* Start Point Banner */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-sm">
                        Start Node
                      </span>
                      <span className="font-mono text-blue-600 truncate">{currentFlow.startPoint}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Trigger Event</span>
                  </div>
                </div>

                {/* Steps Visual Sequence */}
                <div className="space-y-3 relative">
                  {currentFlow.steps.map((step, idx) => {
                    const isLast = idx === currentFlow.steps.length - 1;

                    return (
                      <React.Fragment key={step.id}>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all relative">
                          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-mono text-xs font-bold">
                                {step.stepNumber}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                              {getStepTypeBadge(step.type)}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveStep(step.id, "up")}
                                disabled={idx === 0}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Move Step Up"
                              >
                                <MoveUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveStep(step.id, "down")}
                                disabled={isLast}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                title="Move Step Down"
                              >
                                <MoveDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openEditStepModal(step)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Edit Step"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStep(step.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Step"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Action and System Response Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                            <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                                User Action:
                              </span>
                              <p className="text-slate-800 leading-relaxed">{step.userAction}</p>
                            </div>

                            <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/60">
                              <span className="font-bold text-blue-600 uppercase tracking-wider text-[10px] block mb-1">
                                System Response:
                              </span>
                              <p className="text-slate-800 leading-relaxed">{step.systemResponse}</p>
                            </div>
                          </div>

                          {/* Decision Branches Section */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <GitBranch className="h-3.5 w-3.5 text-purple-600" />
                                Decision Branches & Failure Paths ({step.branches?.length || 0})
                              </span>
                              <button
                                onClick={() => openAddBranchModal(step.id)}
                                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" /> Add Branch
                              </button>
                            </div>

                            {step.branches && step.branches.length > 0 ? (
                              <div className="space-y-1.5">
                                {step.branches.map((b) => (
                                  <div
                                    key={b.id}
                                    className={`flex items-center justify-between p-2 rounded-md border text-xs ${
                                      b.outcomeType === "failure"
                                        ? "bg-rose-50/60 border-rose-200 text-rose-900"
                                        : "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-1.5 py-0.2 rounded-xs font-bold text-[10px] uppercase ${
                                          b.outcomeType === "failure"
                                            ? "bg-rose-200 text-rose-800"
                                            : "bg-emerald-200 text-emerald-800"
                                        }`}
                                      >
                                        {b.outcomeType}
                                      </span>
                                      <span className="font-medium">{b.condition}</span>
                                      <ArrowRight className="h-3 w-3 opacity-60" />
                                      <span className="font-mono text-[11px] opacity-80">
                                        {b.targetStepId || "Next Stage"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteBranch(step.id, b.id)}
                                      className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                      title="Remove branch"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">
                                No custom decision branches. Standard execution proceeds sequentially.
                              </p>
                            )}
                          </div>

                          {/* Traceability links */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              {step.linkedRequirementCode && (
                                <span className="flex items-center gap-1 font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-sm border border-blue-100">
                                  <FileCheck2 className="h-3 w-3" /> {step.linkedRequirementCode}
                                </span>
                              )}
                              {step.linkedTestCaseId && (
                                <span className="flex items-center gap-1 font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-sm border border-indigo-100">
                                  <CheckSquare className="h-3 w-3" /> {step.linkedTestCaseId}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400">Step ID: {step.id}</span>
                          </div>
                        </div>

                        {/* Connection arrow between steps */}
                        {!isLast && (
                          <div className="flex justify-center py-0.5">
                            <ArrowDown className="h-4 w-4 text-slate-300" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* End Point Banner */}
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-sm">
                      Terminal Success
                    </span>
                    <span className="font-semibold">{currentFlow.endPoint}</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Workflow Finalized
                  </span>
                </div>
              </div>

              {/* Right Column: QA Review Panel (1 col) */}
              <div className="space-y-4">
                {/* Health Score Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      QA Workflow Audit
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      {currentFlow.validation.healthScore}% Score
                    </span>
                  </div>

                  {/* Checklist Items */}
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Initial Entry Node</span>
                      {currentFlow.validation.hasStartNode ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Terminal Completion Node</span>
                      {currentFlow.validation.hasTerminalNode ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Negative / Failure Branches</span>
                      {currentFlow.validation.unhandledFailureBranches.length === 0 ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 100% Handled
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />{" "}
                          {currentFlow.validation.unhandledFailureBranches.length} Unhandled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warnings / Auto-Fix Action */}
                  {currentFlow.validation.unhandledFailureBranches.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">
                        Failure Branch Warning:
                      </span>
                      <p className="text-amber-800 leading-relaxed mb-3">
                        {currentFlow.validation.unhandledFailureBranches[0].reason}
                      </p>
                      <button
                        onClick={handleAutoFixFailureBranches}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Auto-Fix Missing Failure Branch</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Traceability Connections Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs text-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-blue-600" />
                    Traceability Connections
                  </h3>

                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Source Evidence:</span>
                    <span className="text-slate-800 font-semibold block bg-slate-50 p-2 rounded-md border border-slate-200">
                      {currentFlow.traceability.sourceEvidence}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Linked Requirements:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {currentFlow.traceability.linkedRequirements.length > 0 ? (
                        currentFlow.traceability.linkedRequirements.map((req) => (
                          <span
                            key={req}
                            className="font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm"
                          >
                            {req}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Auto-linked during execution</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Mapped Test Cases:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {currentFlow.traceability.linkedTestCases.length > 0 ? (
                        currentFlow.traceability.linkedTestCases.map((tc) => (
                          <span
                            key={tc}
                            className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm"
                          >
                            {tc}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No test cases mapped yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Edit / Add Step Modal */}
      {isStepModalOpen && editingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {isNewStep ? "Add Workflow Step" : `Edit Step ${editingStep.stepNumber}`}
              </h3>
              <button onClick={() => setIsStepModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Step Title *</label>
                <input
                  type="text"
                  value={editingStep.title}
                  onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                  placeholder="e.g. Add to Cart & Reserve Stock"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Step Type</label>
                <select
                  value={editingStep.type}
                  onChange={(e) => setEditingStep({ ...editingStep, type: e.target.value as FlowStepType })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="action">Action (Standard User Step)</option>
                  <option value="decision">Decision (Conditional Branching)</option>
                  <option value="verification">Verification (Security / Validation)</option>
                  <option value="terminal">Terminal (Completion State)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">User Action</label>
                <textarea
                  rows={2}
                  value={editingStep.userAction}
                  onChange={(e) => setEditingStep({ ...editingStep, userAction: e.target.value })}
                  placeholder="What action does the user take?"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">System Response</label>
                <textarea
                  rows={2}
                  value={editingStep.systemResponse}
                  onChange={(e) => setEditingStep({ ...editingStep, systemResponse: e.target.value })}
                  placeholder="How does the system react and validate?"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsStepModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStep}
                className="px-5 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Save Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Decision Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add Decision Branch</h3>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Condition Trigger *</label>
                <input
                  type="text"
                  value={newBranch.condition}
                  onChange={(e) => setNewBranch({ ...newBranch, condition: e.target.value })}
                  placeholder="e.g. Card payment rejected by bank or timeout"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Outcome Type</label>
                <select
                  value={newBranch.outcomeType}
                  onChange={(e) => setNewBranch({ ...newBranch, outcomeType: e.target.value as DecisionBranch["outcomeType"] })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="failure">Failure / Exception Path</option>
                  <option value="success">Success / Happy Path</option>
                  <option value="alternative">Alternative Route</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Target Destination</label>
                <select
                  value={newBranch.targetStepId || "TERMINAL_FAILURE"}
                  onChange={(e) => setNewBranch({ ...newBranch, targetStepId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800 font-mono"
                >
                  <option value="TERMINAL_FAILURE">TERMINAL_FAILURE (Display Error / Retry)</option>
                  <option value="TERMINAL_SUCCESS">TERMINAL_SUCCESS (Final Confirmation)</option>
                  {currentFlow?.steps.map((s) => (
                    <option key={s.id} value={s.id}>
                      Step {s.stepNumber}: {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBranch}
                className="px-5 py-2 rounded-lg bg-purple-600 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
              >
                Add Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: New Flow Modal */}
      {isNewFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create New Business Flow</h3>
              <button onClick={() => setIsNewFlowModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Flow Title *</label>
                <input
                  type="text"
                  value={newFlowTitle}
                  onChange={(e) => setNewFlowTitle(e.target.value)}
                  placeholder="e.g. User Registration & Onboarding"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={newFlowCategory}
                  onChange={(e) => setNewFlowCategory(e.target.value as BusinessFlow["category"])}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="User Journey">User Journey</option>
                  <option value="Checkout & Payment">Checkout & Payment</option>
                  <option value="Authentication">Authentication</option>
                  <option value="System Integration">System Integration</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newFlowDescription}
                  onChange={(e) => setNewFlowDescription(e.target.value)}
                  placeholder="Overview of the business purpose..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsNewFlowModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewFlow}
                className="px-5 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Create Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
