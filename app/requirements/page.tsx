"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  FileText,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Download,
  Plus,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  Bug,
  ListChecks,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
  Clock,
  CheckSquare,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";
import { AiPromptGeneratorModal } from "@/components/ai-prompt/AiPromptGeneratorModal";
import { ExportReportModal } from "@/components/export/ExportReportModal";
import { supabase } from "@/lib/supabase/client";
import { useActiveProject } from "@/lib/projects/projectState";
import {
  SystemRequirement,
  RequirementCategory,
  RequirementStatus,
  RequirementPriority,
  REQUIREMENT_CATEGORIES,
  REQUIREMENT_STATUSES,
} from "@/types/requirements";
import { VerificationStatus, TenSectionAnalysis } from "@/types/website-analysis";
import {
  generateAcceptanceCriteriaForRequirement,
  generateRequirementsFromAnalysis,
  generateDomainTailoredRequirements,
  formatRequirementsAsMarkdown,
  formatRequirementsAsCsv,
} from "@/lib/requirements/requirementsGenerator";
import { Json } from "@/types/supabase";

export default function RequirementsPage() {
  // Sidebar & Layout State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Active Project State
  const { activeProjectId, activeProject, projects } = useActiveProject();

  // Requirements State
  const [requirements, setRequirements] = useState<SystemRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedVerification, setSelectedVerification] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Expanded Acceptance Criteria Cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<SystemRequirement | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRequirement, setRejectingRequirement] = useState<SystemRequirement | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"markdown" | "json" | "csv">("markdown");
  const [pendingConversion, setPendingConversion] = useState<{ domain: string; title: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("qa_hub_converted_requirement");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.domain) {
            setPendingConversion({ domain: parsed.domain, title: parsed.title || parsed.domain });
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    setStatusNotification({ type, message });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  // 1. Fetch requirements for active project from Supabase
  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .eq("project_id", activeProjectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not query requirements from Supabase:", error.message);
      }

      if (data && data.length > 0) {
        const mapped: SystemRequirement[] = data.map((row, index) => {
          const analysisObj = (row.analysis as Record<string, unknown>) || {};
          const rawTextLines = (row.raw_text || "").split("\n\nAcceptance Criteria:");
          const description = rawTextLines[0] || row.raw_text || "";

          let acList: string[] = [];
          if (Array.isArray(analysisObj.acceptanceCriteria)) {
            acList = analysisObj.acceptanceCriteria as string[];
          } else if (rawTextLines[1]) {
            acList = rawTextLines[1]
              .split("\n")
              .map((l) => l.replace(/^\d+\.\s*/, "").trim())
              .filter(Boolean);
          }

          const category =
            (analysisObj.category as RequirementCategory) ||
            (row.title.toLowerCase().includes("auth") || row.title.toLowerCase().includes("security")
              ? "Security"
              : row.title.toLowerCase().includes("rule") || row.title.toLowerCase().includes("payment")
              ? "Business Rules"
              : "Functional");

          const reqCode =
            (analysisObj.reqCode as string) ||
            `REQ-${category === "Security" ? "SEC" : category === "Business Rules" ? "BIZ" : "FUNC"}-${String(
              index + 1
            ).padStart(3, "0")}`;

          const status: RequirementStatus =
            (analysisObj.displayStatus as RequirementStatus) ||
            (row.status === "approved"
              ? "Approved"
              : row.status === "archived"
              ? "Rejected"
              : row.status === "analyzed"
              ? "Reviewed"
              : "AI Generated");

          const priority: RequirementPriority =
            (analysisObj.priority as RequirementPriority) ||
            (row.risk_level === "critical"
              ? "Critical"
              : row.risk_level === "high"
              ? "High"
              : row.risk_level === "medium"
              ? "Medium"
              : "Low");

          const verificationStatus: VerificationStatus =
            (analysisObj.verificationStatus as VerificationStatus) || "Verified";

          const traceability = (analysisObj.traceability as SystemRequirement["traceability"]) || {
            sourceFeature: row.title,
            businessFlow: `${activeProject.name} Workflow`,
            testCasesCount: 2,
            defectsCount: 0,
            sourceUrl: `https://${activeProject.domain}`,
          };

          return {
            id: row.id,
            projectId: row.project_id,
            reqCode,
            title: row.title,
            description,
            category,
            status,
            priority,
            verificationStatus,
            acceptanceCriteria:
              acList.length > 0
                ? acList
                : generateAcceptanceCriteriaForRequirement(row.title, category, description),
            traceability,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        setRequirements(mapped);
      } else {
        // No records in DB for this project yet: set empty so user can generate
        setRequirements([]);
      }
    } catch (err) {
      console.error("Error loading requirements:", err);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [activeProjectId]);

  // 2. Action: "Generate Requirements from Website Analysis"
  const handleGenerateFromAnalysis = async () => {
    try {
      setIsGenerating(true);
      notify(
        `Scanning website analysis data for "${activeProject.name}" (${activeProject.domain})...`,
        "info"
      );

      // Check Supabase website_analyses for active project or domain
      let tenSection: TenSectionAnalysis | null = null;
      try {
        const { data: analyses, error } = await supabase
          .from("website_analyses")
          .select("business_analysis_report, ten_section_analysis, domain, project_id")
          .or(`project_id.eq.${activeProjectId},domain.ilike.%${activeProject.domain}%`)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && analyses && analyses.length > 0) {
          const report = analyses[0].business_analysis_report || analyses[0].ten_section_analysis;
          if (report && typeof report === "object" && "section4_featuresAndWorkflows" in report) {
            tenSection = report as TenSectionAnalysis;
          }
        }
      } catch (err) {
        console.warn("Supabase website_analyses query skipped:", err);
      }

      // Fallback to sessionStorage if user recently ran analysis in browser
      if (!tenSection && typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem("qa_hub_last_analysis");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.tenSectionAnalysis) {
              tenSection = parsed.tenSectionAnalysis as TenSectionAnalysis;
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      // Generate traceable requirements
      const newReqs = generateRequirementsFromAnalysis(
        tenSection,
        activeProject,
        requirements.length
      );

      // Insert into Supabase requirements table
      let insertedCount = 0;
      for (const req of newReqs) {
        try {
          const rawText = `${req.description}\n\nAcceptance Criteria:\n${req.acceptanceCriteria
            .map((ac, idx) => `${idx + 1}. ${ac}`)
            .join("\n")}`;

          const { data, error } = await supabase
            .from("requirements")
            .insert({
              project_id: activeProjectId,
              title: req.title,
              raw_text: rawText,
              risk_level: req.priority.toLowerCase() as "low" | "medium" | "high" | "critical",
              status: req.status === "Approved" ? "approved" : "draft",
              analysis: {
                reqCode: req.reqCode,
                category: req.category,
                displayStatus: req.status,
                priority: req.priority,
                verificationStatus: req.verificationStatus,
                acceptanceCriteria: req.acceptanceCriteria,
                traceability: req.traceability,
              } as unknown as Json,
            })
            .select("id")
            .single();

          if (!error && data?.id) {
            req.id = data.id;
            insertedCount++;
          }
        } catch (dbErr) {
          console.warn("Supabase insertion skipped:", dbErr);
        }
      }

      // Update state
      setRequirements((prev) => [...newReqs, ...prev]);

      // Automatically expand the first 2 new requirements
      if (newReqs.length > 0) {
        setExpandedCards((prev) => ({
          ...prev,
          [newReqs[0].id]: true,
          ...(newReqs[1] ? { [newReqs[1].id]: true } : {}),
        }));
      }

      // Clear any pending cached conversion
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("qa_hub_converted_requirement");
          setPendingConversion(null);
        } catch {}
      }

      notify(
        `Generated ${newReqs.length} traceable requirements from Website Analysis (${insertedCount} saved to Supabase).`,
        "success"
      );
    } catch (err) {
      console.error("Failed to generate requirements:", err);
      notify("Failed to generate requirements from analysis.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Action: Approve Requirement
  const handleApprove = async (id: string) => {
    const target = requirements.find((r) => r.id === id);
    if (!target) return;

    const updatedStatus: RequirementStatus = "Approved";

    // Optimistic UI update
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: updatedStatus } : r))
    );

    notify(`Requirement "${target.reqCode}" has been Approved.`, "success");

    // Sync to Supabase
    try {
      await supabase
        .from("requirements")
        .update({
          status: "approved",
          analysis: {
            reqCode: target.reqCode,
            category: target.category,
            displayStatus: updatedStatus,
            priority: target.priority,
            verificationStatus: target.verificationStatus,
            acceptanceCriteria: target.acceptanceCriteria,
            traceability: target.traceability,
          } as unknown as Json,
        })
        .eq("id", id);
    } catch (err) {
      console.warn("Supabase update skipped:", err);
    }
  };

  // 4. Action: Reject Requirement (Open Modal)
  const openRejectModal = (req: SystemRequirement) => {
    setRejectingRequirement(req);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequirement) return;
    const id = rejectingRequirement.id;
    const updatedStatus: RequirementStatus = "Rejected";

    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: updatedStatus } : r))
    );

    notify(`Requirement "${rejectingRequirement.reqCode}" marked as Rejected.`, "info");
    setIsRejectModalOpen(false);

    // Sync to Supabase
    try {
      await supabase
        .from("requirements")
        .update({
          status: "archived",
          analysis: {
            reqCode: rejectingRequirement.reqCode,
            category: rejectingRequirement.category,
            displayStatus: updatedStatus,
            priority: rejectingRequirement.priority,
            verificationStatus: rejectingRequirement.verificationStatus,
            acceptanceCriteria: rejectingRequirement.acceptanceCriteria,
            traceability: rejectingRequirement.traceability,
            rejectionReason: rejectReason || "Rejected during QA review",
          } as unknown as Json,
        })
        .eq("id", id);
    } catch (err) {
      console.warn("Supabase rejection update skipped:", err);
    }
  };

  // 5. Action: Delete Requirement
  const handleDelete = async (id: string, reqCode: string) => {
    if (!window.confirm(`Are you sure you want to delete requirement "${reqCode}"?`)) {
      return;
    }

    setRequirements((prev) => prev.filter((r) => r.id !== id));
    notify(`Requirement "${reqCode}" was deleted.`, "info");

    try {
      await supabase.from("requirements").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase delete skipped:", err);
    }
  };

  // 6. Action: Generate Acceptance Criteria for a single requirement
  const handleGenerateCriteria = async (id: string) => {
    const target = requirements.find((r) => r.id === id);
    if (!target) return;

    const newCriteria = generateAcceptanceCriteriaForRequirement(
      target.title,
      target.category,
      target.description
    );

    setRequirements((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, acceptanceCriteria: newCriteria } : r
      )
    );

    // Ensure card is expanded to show new criteria
    setExpandedCards((prev) => ({ ...prev, [id]: true }));
    notify(`Generated ${newCriteria.length} acceptance criteria for ${target.reqCode}.`, "success");

    // Sync to Supabase
    try {
      const rawText = `${target.description}\n\nAcceptance Criteria:\n${newCriteria
        .map((ac, idx) => `${idx + 1}. ${ac}`)
        .join("\n")}`;

      await supabase
        .from("requirements")
        .update({
          raw_text: rawText,
          analysis: {
            reqCode: target.reqCode,
            category: target.category,
            displayStatus: target.status,
            priority: target.priority,
            verificationStatus: target.verificationStatus,
            acceptanceCriteria: newCriteria,
            traceability: target.traceability,
          } as unknown as Json,
        })
        .eq("id", id);
    } catch (err) {
      console.warn("Supabase criteria update skipped:", err);
    }
  };

  // 7. Action: Edit / Create Requirement Modal
  const openEditModal = (req: SystemRequirement) => {
    setEditingRequirement({ ...req, acceptanceCriteria: [...req.acceptanceCriteria] });
    setIsNewModal(false);
    setIsEditModalOpen(true);
  };

  const openNewModal = () => {
    const nextSeq = requirements.length + 1;
    const newReq: SystemRequirement = {
      id: `custom_${Date.now()}`,
      projectId: activeProjectId,
      reqCode: `REQ-FUNC-${String(nextSeq).padStart(3, "0")}`,
      title: "",
      description: "",
      category: "Functional",
      status: "Draft",
      priority: "High",
      verificationStatus: "Verified",
      acceptanceCriteria: [
        "Given a registered user is logged in, When they initiate this action, Then the system completes the transaction successfully.",
      ],
      traceability: {
        sourceFeature: "Custom Specification",
        businessFlow: `${activeProject.name} Workflow`,
        testCasesCount: 1,
        defectsCount: 0,
        sourceUrl: `https://${activeProject.domain}`,
      },
    };
    setEditingRequirement(newReq);
    setIsNewModal(true);
    setIsEditModalOpen(true);
  };

  const handleSaveRequirement = async () => {
    if (!editingRequirement || !editingRequirement.title.trim()) {
      alert("Please provide a requirement title.");
      return;
    }

    const updated = { ...editingRequirement };

    if (isNewModal) {
      // Insert to state
      setRequirements((prev) => [updated, ...prev]);
      notify(`Requirement "${updated.reqCode}" created.`, "success");

      // Save to Supabase
      try {
        const rawText = `${updated.description}\n\nAcceptance Criteria:\n${updated.acceptanceCriteria
          .map((ac, idx) => `${idx + 1}. ${ac}`)
          .join("\n")}`;

        const { data, error } = await supabase
          .from("requirements")
          .insert({
            project_id: activeProjectId,
            title: updated.title,
            raw_text: rawText,
            risk_level: updated.priority.toLowerCase() as "low" | "medium" | "high" | "critical",
            status: updated.status === "Approved" ? "approved" : "draft",
            analysis: {
              reqCode: updated.reqCode,
              category: updated.category,
              displayStatus: updated.status,
              priority: updated.priority,
              verificationStatus: updated.verificationStatus,
              acceptanceCriteria: updated.acceptanceCriteria,
              traceability: updated.traceability,
            } as unknown as Json,
          })
          .select("id")
          .single();

        if (!error && data?.id) {
          updated.id = data.id;
          setRequirements((prev) =>
            prev.map((r) => (r.reqCode === updated.reqCode ? { ...r, id: data.id } : r))
          );
        }
      } catch (err) {
        console.warn("Supabase create skipped:", err);
      }
    } else {
      // Update existing
      setRequirements((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      notify(`Requirement "${updated.reqCode}" updated.`, "success");

      try {
        const rawText = `${updated.description}\n\nAcceptance Criteria:\n${updated.acceptanceCriteria
          .map((ac, idx) => `${idx + 1}. ${ac}`)
          .join("\n")}`;

        await supabase
          .from("requirements")
          .update({
            title: updated.title,
            raw_text: rawText,
            risk_level: updated.priority.toLowerCase() as "low" | "medium" | "high" | "critical",
            status:
              updated.status === "Approved"
                ? "approved"
                : updated.status === "Rejected"
                ? "archived"
                : "draft",
            analysis: {
              reqCode: updated.reqCode,
              category: updated.category,
              displayStatus: updated.status,
              priority: updated.priority,
              verificationStatus: updated.verificationStatus,
              acceptanceCriteria: updated.acceptanceCriteria,
              traceability: updated.traceability,
            } as unknown as Json,
          })
          .eq("id", updated.id);
      } catch (err) {
        console.warn("Supabase update skipped:", err);
      }
    }

    setIsEditModalOpen(false);
  };

  // 8. Action: Export Requirements
  const handleDownloadExport = () => {
    const listToExport = filteredRequirements.length > 0 ? filteredRequirements : requirements;
    if (listToExport.length === 0) {
      alert("No requirements available to export.");
      return;
    }

    let fileContent = "";
    let mimeType = "text/plain";
    let fileExt = "txt";

    if (exportFormat === "markdown") {
      fileContent = formatRequirementsAsMarkdown(
        listToExport,
        activeProject.name,
        activeProject.domain
      );
      mimeType = "text/markdown";
      fileExt = "md";
    } else if (exportFormat === "csv") {
      fileContent = formatRequirementsAsCsv(listToExport);
      mimeType = "text/csv";
      fileExt = "csv";
    } else if (exportFormat === "json") {
      fileContent = JSON.stringify(
        {
          project: activeProject.name,
          domain: activeProject.domain,
          exportedAt: new Date().toISOString(),
          totalRequirements: listToExport.length,
          requirements: listToExport,
        },
        null,
        2
      );
      mimeType = "application/json";
      fileExt = "json";
    }

    const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = activeProject.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    link.href = url;
    link.setAttribute("download", `requirements-${sanitizedName}-${Date.now()}.${fileExt}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    notify(`Exported ${listToExport.length} requirements as .${fileExt}`, "success");
  };

  // Filter & Search Logic
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      // Category filter
      if (selectedCategory !== "All" && req.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "All" && req.status !== selectedStatus) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== "All" && req.priority !== selectedPriority) {
        return false;
      }
      // Verification status filter
      if (selectedVerification !== "All" && req.verificationStatus !== selectedVerification) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = req.reqCode.toLowerCase().includes(q);
        const matchesTitle = req.title.toLowerCase().includes(q);
        const matchesDesc = req.description.toLowerCase().includes(q);
        const matchesFeature = req.traceability.sourceFeature.toLowerCase().includes(q);
        const matchesAc = req.acceptanceCriteria.some((ac) => ac.toLowerCase().includes(q));
        if (!matchesCode && !matchesTitle && !matchesDesc && !matchesFeature && !matchesAc) {
          return false;
        }
      }
      return true;
    });
  }, [requirements, selectedCategory, selectedStatus, selectedPriority, selectedVerification, searchQuery]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const total = requirements.length;
    const approved = requirements.filter((r) => r.status === "Approved").length;
    const reviewed = requirements.filter((r) => r.status === "Reviewed").length;
    const aiGenerated = requirements.filter((r) => r.status === "AI Generated").length;
    const verified = requirements.filter((r) => r.verificationStatus === "Verified").length;
    const totalTestCases = requirements.reduce(
      (sum, r) => sum + (r.traceability?.testCasesCount || 0),
      0
    );
    const totalDefects = requirements.reduce(
      (sum, r) => sum + (r.traceability?.defectsCount || 0),
      0
    );

    return {
      total,
      approved,
      reviewed,
      aiGenerated,
      verified,
      totalTestCases,
      totalDefects,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }, [requirements]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Badge styling helpers
  const getCategoryBadgeClass = (category: RequirementCategory) => {
    switch (category) {
      case "Functional":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Business Rules":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "User Requirements":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Non-Functional":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Security":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadgeClass = (priority: RequirementPriority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-600 text-white font-semibold";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-amber-100 text-amber-900 border border-amber-300";
      case "Low":
        return "bg-slate-100 text-slate-700 border border-slate-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusBadgeClass = (status: RequirementStatus) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold";
      case "Reviewed":
        return "bg-sky-50 text-sky-700 border border-sky-300";
      case "AI Generated":
        return "bg-violet-50 text-violet-700 border border-violet-200 font-medium";
      case "Draft":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getVerificationBadge = (vStatus: VerificationStatus) => {
    switch (vStatus) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Verified
          </span>
        );
      case "Potential Issue":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            Potential Issue
          </span>
        );
      case "Unverified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Unverified
          </span>
        );
      case "AI Generated":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="h-3 w-3 text-purple-600" />
            AI Generated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Not Tested
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {/* 1. Dark Navy Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeModule="requirements"
      />

      {/* 2. Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        {/* Status Notification Toast */}
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
              <span
                className={`flex h-2 w-2 rounded-full animate-pulse ${
                  statusNotification.type === "success"
                    ? "bg-emerald-400"
                    : statusNotification.type === "error"
                    ? "bg-rose-400"
                    : "bg-cyan-400"
                }`}
              />
              <span>{statusNotification.message}</span>
            </div>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-slate-400 hover:text-white text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Top Title & Primary Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm uppercase">
                  SRS & Traceability Engine
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Active Project:
                  <span className="font-semibold text-slate-800">
                    {activeProject.name}
                  </span>
                  <span className="text-slate-400">({activeProject.domain})</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                System Requirements & Traceability
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Audit-grade requirement specifications linked directly to crawled website features,
                business flows, test cases, and live defect metrics.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleGenerateFromAnalysis}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 cursor-pointer"
                title="Automatically translate crawled website analysis into traceable requirements"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Generate from Website Analysis</span>
              </button>

              <button
                onClick={openNewModal}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4 text-slate-500" />
                <span>New Requirement</span>
              </button>

              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all shadow-xs cursor-pointer"
                title="Generate specialized AI QA Prompts across 12 domains"
              >
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>AI Prompt Generator</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
                title="Export requirements as Markdown, CSV, HTML, or JSON"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Pending Website Analysis Import Banner */}
          {pendingConversion && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-700/50">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/40 text-cyan-300 border border-cyan-400/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Website Intelligence Ready for Import</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-cyan-400/20 text-cyan-300 font-normal">
                      Phase 4 Analysis
                    </span>
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Verified business and QA report for <strong className="text-cyan-300 font-semibold">{pendingConversion.domain}</strong> is cached and ready to generate traceable system specifications.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={handleGenerateFromAnalysis}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  <span>Import Now</span>
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      sessionStorage.removeItem("qa_hub_converted_requirement");
                    }
                    setPendingConversion(null);
                  }}
                  className="text-xs text-blue-300 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Traceability KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Specs</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                  Traceable
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Approved</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">{metrics.approved}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                  {metrics.approvalRate}%
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">AI Generated</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-violet-600">{metrics.aiGenerated}</span>
                <span className="text-[11px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-sm">
                  Active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Verified Evidence</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{metrics.verified}</span>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                  Audited
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Linked Test Cases</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-indigo-600">{metrics.totalTestCases}</span>
                <span className="text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                  Mapped
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Linked Defects</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${metrics.totalDefects > 0 ? "text-rose-600" : "text-slate-800"}`}>
                  {metrics.totalDefects}
                </span>
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded-sm ${
                    metrics.totalDefects > 0
                      ? "text-rose-700 bg-rose-50"
                      : "text-slate-500 bg-slate-100"
                  }`}
                >
                  {metrics.totalDefects === 0 ? "Zero Bugs" : "Action Req."}
                </span>
              </div>
            </div>
          </div>

          {/* Category Filters Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            {/* Category Pills */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Category:
                </span>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === "All"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Categories ({requirements.length})
                </button>
                {REQUIREMENT_CATEGORIES.map((cat) => {
                  const count = requirements.filter((r) => r.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs font-semibold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>

              {/* Reset Filters button */}
              {(selectedCategory !== "All" ||
                selectedStatus !== "All" ||
                selectedPriority !== "All" ||
                selectedVerification !== "All" ||
                searchQuery.trim().length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedStatus("All");
                    setSelectedPriority("All");
                    setSelectedVerification("All");
                    setSearchQuery("");
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Search and Secondary Filter Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requirement ID, title, acceptance criteria..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status & Priority dropdowns */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="All">All Statuses</option>
                    {REQUIREMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Priority:</span>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Verification Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Verification:</span>
                  <select
                    value={selectedVerification}
                    onChange={(e) => setSelectedVerification(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="All">All Verification</option>
                    <option value="Verified">Verified</option>
                    <option value="Potential Issue">Potential Issue</option>
                    <option value="Unverified">Unverified</option>
                    <option value="AI Generated">AI Generated</option>
                  </select>
                </div>

                <div className="text-xs font-medium text-slate-500 ml-2">
                  Showing <span className="font-bold text-slate-800">{filteredRequirements.length}</span> of{" "}
                  {requirements.length}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-xs">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Loading requirements from Supabase...
              </p>
              <p className="text-xs text-slate-500">
                Synchronizing with project: {activeProject.name}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredRequirements.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {requirements.length === 0
                  ? "No Requirements Configured for This Project"
                  : "No Requirements Match Your Active Filters"}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mt-1 mb-5">
                {requirements.length === 0
                  ? `Generate audit-grade traceable requirements directly from the crawled website intelligence for ${activeProject.name} (${activeProject.domain}).`
                  : "Try clearing your category, status, or search filters to see all available specifications."}
              </p>

              {requirements.length === 0 ? (
                <button
                  onClick={handleGenerateFromAnalysis}
                  disabled={isGenerating}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>Generate Requirements from Website Analysis</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedStatus("All");
                    setSelectedPriority("All");
                    setSelectedVerification("All");
                    setSearchQuery("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Requirements List Cards */}
          {!loading && filteredRequirements.length > 0 && (
            <div className="space-y-4">
              {filteredRequirements.map((req) => {
                const isExpanded = !!expandedCards[req.id];

                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
                  >
                    {/* Header Row: ID, Title, Badges */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Requirement Code Badge with Copy */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white shadow-2xs">
                            {req.reqCode}
                          </span>
                          <button
                            onClick={() => copyToClipboard(req.reqCode, req.id)}
                            className="text-slate-400 hover:text-slate-700 p-1"
                            title="Copy Requirement ID"
                          >
                            {copiedId === req.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Title & Metadata Badges */}
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            {req.title}
                          </h2>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {/* Category Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${getCategoryBadgeClass(
                                req.category
                              )}`}
                            >
                              {req.category}
                            </span>

                            {/* Priority Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[11px] ${getPriorityBadgeClass(
                                req.priority
                              )}`}
                            >
                              {req.priority} Priority
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-sm text-[11px] ${getStatusBadgeClass(
                                req.status
                              )}`}
                            >
                              {req.status}
                            </span>

                            {/* Verification Badge */}
                            {getVerificationBadge(req.verificationStatus)}
                          </div>
                        </div>
                      </div>

                      {/* Primary Requirement Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end lg:self-start shrink-0 flex-wrap">
                        {/* Approve Button */}
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={req.status === "Approved"}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            req.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-80 cursor-default"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                          }`}
                          title="Mark requirement as Approved"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{req.status === "Approved" ? "Approved" : "Approve"}</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          onClick={() => openRejectModal(req)}
                          disabled={req.status === "Rejected"}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            req.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 opacity-80 cursor-default"
                              : "border border-rose-200 text-rose-700 hover:bg-rose-50"
                          }`}
                          title="Reject requirement with reason"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(req)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                          title="Edit requirement title, category, description, and criteria"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {/* Generate AC Button */}
                        <button
                          onClick={() => handleGenerateCriteria(req.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-violet-200 bg-violet-50/50 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-all cursor-pointer"
                          title="Synthesize 3-5 structured Gherkin acceptance criteria"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                          <span>Generate AC</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(req.id, req.reqCode)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Delete requirement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Requirement Description */}
                    <div className="pt-3 pb-2">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {req.description}
                      </p>
                    </div>

                    {/* Acceptance Criteria Collapsible Panel */}
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <div
                        onClick={() => toggleExpandCard(req.id)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">
                            Acceptance Criteria ({req.acceptanceCriteria.length})
                          </span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                          <span>{isExpanded ? "Collapse" : "Expand"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Criteria Items List */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/80">
                          {req.acceptanceCriteria.map((ac, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 bg-white p-2.5 rounded-md border border-slate-200 text-xs text-slate-800 leading-relaxed"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 font-mono text-[10px] font-bold text-blue-700">
                                {idx + 1}
                              </span>
                              <span className="font-mono text-slate-700">{ac}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Traceability Matrix Footer Row */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {/* Left: Source Feature & Business Flow */}
                      <div className="flex items-center gap-4 flex-wrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Source Feature:</span>
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-sm">
                            {req.traceability.sourceFeature}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-400 font-medium">Flow:</span>
                          <span className="font-medium text-slate-700">
                            {req.traceability.businessFlow}
                          </span>
                        </div>
                      </div>

                      {/* Right: Test Cases & Defects Count Badges */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Test Cases Count */}
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                          title="Linked QA Test Cases"
                        >
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{req.traceability.testCasesCount} Test Cases</span>
                        </div>

                        {/* Defects Count */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold ${
                            req.traceability.defectsCount > 0
                              ? "bg-rose-50 border border-rose-200 text-rose-700"
                              : "bg-slate-50 border border-slate-200 text-slate-600"
                          }`}
                          title="Linked Verified Bugs / Defects"
                        >
                          <Bug
                            className={`h-3.5 w-3.5 ${
                              req.traceability.defectsCount > 0 ? "text-rose-600" : "text-slate-400"
                            }`}
                          />
                          <span>{req.traceability.defectsCount} Defects</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Create / Edit Requirement Modal */}
      {isEditModalOpen && editingRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {isNewModal ? "Create System Requirement" : `Edit ${editingRequirement.reqCode}`}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Req Code & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Req ID
                  </label>
                  <input
                    type="text"
                    value={editingRequirement.reqCode}
                    onChange={(e) =>
                      setEditingRequirement({ ...editingRequirement, reqCode: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editingRequirement.title}
                    onChange={(e) =>
                      setEditingRequirement({ ...editingRequirement, title: e.target.value })
                    }
                    placeholder="e.g. Multi-Tenant Role Isolation"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category, Priority, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingRequirement.category}
                    onChange={(e) =>
                      setEditingRequirement({
                        ...editingRequirement,
                        category: e.target.value as RequirementCategory,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    {REQUIREMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={editingRequirement.priority}
                    onChange={(e) =>
                      setEditingRequirement({
                        ...editingRequirement,
                        priority: e.target.value as RequirementPriority,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editingRequirement.status}
                    onChange={(e) =>
                      setEditingRequirement({
                        ...editingRequirement,
                        status: e.target.value as RequirementStatus,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    {REQUIREMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specification Description
                </label>
                <textarea
                  rows={3}
                  value={editingRequirement.description}
                  onChange={(e) =>
                    setEditingRequirement({ ...editingRequirement, description: e.target.value })
                  }
                  placeholder="Comprehensive description of the functional or business behavior required..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden font-normal"
                />
              </div>

              {/* Acceptance Criteria Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Acceptance Criteria (Gherkin Format)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedAc = [
                        ...editingRequirement.acceptanceCriteria,
                        "Given ..., When ..., Then ...",
                      ];
                      setEditingRequirement({
                        ...editingRequirement,
                        acceptanceCriteria: updatedAc,
                      });
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Criterion
                  </button>
                </div>

                <div className="space-y-2">
                  {editingRequirement.acceptanceCriteria.map((ac, acIdx) => (
                    <div key={acIdx} className="flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-600 mt-1">
                        {acIdx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={ac}
                        onChange={(e) => {
                          const updatedAc = [...editingRequirement.acceptanceCriteria];
                          updatedAc[acIdx] = e.target.value;
                          setEditingRequirement({
                            ...editingRequirement,
                            acceptanceCriteria: updatedAc,
                          });
                        }}
                        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedAc = editingRequirement.acceptanceCriteria.filter(
                            (_, i) => i !== acIdx
                          );
                          setEditingRequirement({
                            ...editingRequirement,
                            acceptanceCriteria: updatedAc,
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 mt-1"
                        title="Remove criterion"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traceability Fields */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Traceability Links
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                      Source Feature
                    </label>
                    <input
                      type="text"
                      value={editingRequirement.traceability.sourceFeature}
                      onChange={(e) =>
                        setEditingRequirement({
                          ...editingRequirement,
                          traceability: {
                            ...editingRequirement.traceability,
                            sourceFeature: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">
                      Business Flow
                    </label>
                    <input
                      type="text"
                      value={editingRequirement.traceability.businessFlow}
                      onChange={(e) =>
                        setEditingRequirement({
                          ...editingRequirement,
                          traceability: {
                            ...editingRequirement.traceability,
                            businessFlow: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRequirement}
                className="px-5 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Save Requirement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Requirement Modal */}
      {isRejectModalOpen && rejectingRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-200">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reject Requirement {rejectingRequirement.reqCode}
                </h3>
                <p className="text-xs text-slate-500">Provide an audit reason for rejecting this specification.</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rejection Note / Feedback
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Scope changed: this feature will be deprecated in Q4 release."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-lg bg-rose-600 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 7: Professional Report Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportData={{
          project: activeProject,
          requirements: filteredRequirements.length > 0 ? filteredRequirements : requirements,
        }}
      />

      {/* Phase 7: AI Prompt Generator Modal */}
      <AiPromptGeneratorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        context={{
          targetUrl: `https://${activeProject.domain}`,
          domain: activeProject.domain,
          businessType: "System Requirements Engineering",
          projectName: activeProject.name,
          requirements: requirements.map((r) => ({
            reqCode: r.reqCode,
            title: r.title,
            category: r.category,
          })),
        }}
      />
    </div>
  );
}
