"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Bot,
  X,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { NAVIGATION_ITEMS } from "@/data/dashboardData";
import { NavModuleId, NavItem } from "@/types/dashboard";
import { useActiveProject } from "@/lib/projects/projectState";
import { supabase } from "@/lib/supabase/client";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeModule?: NavModuleId;
  setActiveModule?: (moduleId: NavModuleId) => void;
}

interface HoveredTooltipInfo {
  id: string;
  label: string;
  category?: string;
  count?: number;
  top: number;
}

interface VerifiedCounts {
  [moduleId: string]: number | undefined;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  activeModule = "dashboard",
  setActiveModule,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Active Project Management (persisted across route transitions via localStorage)
  const { activeProjectId, activeProject, projects, setActiveProjectId } =
    useActiveProject();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Tooltip tracking for collapsed sidebar view (fixed coordinates to prevent scroll clipping)
  const [hoveredTooltip, setHoveredTooltip] = useState<HoveredTooltipInfo | null>(null);

  // Real verified counts from Supabase (Zero fake hardcoded numbers)
  const [verifiedCounts, setVerifiedCounts] = useState<VerifiedCounts>({});

  // Close project dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch real verified counts from Supabase (only show badge when real data exists)
  useEffect(() => {
    let isSubscribed = true;

    async function loadVerifiedCounts() {
      try {
        const counts: VerifiedCounts = {};

        // 1. Verified Website Analyses count
        const { count: waCount, error: waErr } = await supabase
          .from("website_analyses")
          .select("id", { count: "exact", head: true });
        if (!waErr && typeof waCount === "number" && waCount > 0) {
          counts["website-analysis"] = waCount;
        }

        // 2. Verified Requirements count
        const { count: reqCount, error: reqErr } = await supabase
          .from("requirements")
          .select("id", { count: "exact", head: true });
        if (!reqErr && typeof reqCount === "number" && reqCount > 0) {
          counts["requirements"] = reqCount;
        }

        // 3. Verified Test Cases count
        const { count: tcCount, error: tcErr } = await supabase
          .from("test_cases")
          .select("id", { count: "exact", head: true });
        if (!tcErr && typeof tcCount === "number" && tcCount > 0) {
          counts["test-cases"] = tcCount;
          counts["functional-qa"] = tcCount;
        }

        // 4. Verified Bugs/Defects count
        const { count: bugCount, error: bugErr } = await supabase
          .from("bugs")
          .select("id", { count: "exact", head: true });
        if (!bugErr && typeof bugCount === "number" && bugCount > 0) {
          counts["defect-management"] = bugCount;
          counts["bug-reports"] = bugCount;
        }

        // 5. Verified Business Flows count
        try {
          const { count: flowCount, error: flowErr } = await supabase
            .from("business_flows")
            .select("id", { count: "exact", head: true });
          if (!flowErr && typeof flowCount === "number" && flowCount > 0) {
            counts["business-flows"] = flowCount;
          }
        } catch {}

        // 6. Verified Manual QA Test Runs count
        try {
          const { count: trCount, error: trErr } = await supabase
            .from("test_runs")
            .select("id", { count: "exact", head: true });
          if (!trErr && typeof trCount === "number" && trCount > 0) {
            counts["manual-qa"] = trCount;
          }
        } catch {}

        // 7. Verified Security Scans count
        try {
          const { count: secCount, error: secErr } = await supabase
            .from("security_scans")
            .select("id", { count: "exact", head: true });
          if (!secErr && typeof secCount === "number" && secCount > 0) {
            counts["security-testing"] = secCount;
          }
        } catch {}

        // 8. Verified Performance Scans count
        try {
          const { count: perfCount, error: perfErr } = await supabase
            .from("performance_scans")
            .select("id", { count: "exact", head: true });
          if (!perfErr && typeof perfCount === "number" && perfCount > 0) {
            counts["performance-testing"] = perfCount;
            counts["performance"] = perfCount;
          }
        } catch {}

        if (isSubscribed) {
          setVerifiedCounts(counts);
        }
      } catch {
        // Supabase offline or credentials unconfigured: do not set fake counts
      }
    }

    loadVerifiedCounts();
    return () => {
      isSubscribed = false;
    };
  }, [activeProjectId]);

  // Exact 3 professional navigation sections
  const SECTIONS = [
    {
      title: "ANALYSIS & REQUIREMENTS",
      categoryKey: "ANALYSIS & REQUIREMENTS" as const,
      items: NAVIGATION_ITEMS.filter(
        (item) => item.category === "ANALYSIS & REQUIREMENTS"
      ),
    },
    {
      title: "TEST MANAGEMENT",
      categoryKey: "TEST MANAGEMENT" as const,
      items: NAVIGATION_ITEMS.filter(
        (item) => item.category === "TEST MANAGEMENT"
      ),
    },
    {
      title: "AUTOMATION & SECURITY",
      categoryKey: "AUTOMATION & SECURITY" as const,
      items: NAVIGATION_ITEMS.filter(
        (item) => item.category === "AUTOMATION & SECURITY"
      ),
    },
  ];

  // Route transition handler
  const handleNavClick = (moduleId: NavModuleId) => {
    if (setActiveModule) {
      setActiveModule(moduleId);
    }

    if (moduleId === "website-analysis") {
      if (pathname !== "/website-analysis") {
        router.push("/website-analysis");
      }
    } else if (moduleId === "requirements" || moduleId === "system-requirements") {
      if (pathname !== "/requirements") {
        router.push("/requirements");
      }
    } else if (moduleId === "business-flows") {
      if (pathname !== "/business-flows") {
        router.push("/business-flows");
      }
    } else if (moduleId === "functional-qa") {
      if (pathname !== "/functional-qa") {
        router.push("/functional-qa");
      }
    } else if (moduleId === "test-cases") {
      if (pathname !== "/test-cases") {
        router.push("/test-cases");
      }
    } else if (moduleId === "manual-qa") {
      if (pathname !== "/manual-qa") {
        router.push("/manual-qa");
      }
    } else if (moduleId === "defect-management" || moduleId === "bug-reports") {
      if (pathname !== "/defect-management") {
        router.push("/defect-management");
      }
    } else if (moduleId === "api-testing") {
      if (pathname !== "/api-testing") {
        router.push("/api-testing");
      }
    } else if (moduleId === "playwright-automation") {
      if (pathname !== "/playwright-automation") {
        router.push("/playwright-automation");
      }
    } else if (moduleId === "security-testing") {
      if (pathname !== "/security-testing") {
        router.push("/security-testing");
      }
    } else if (moduleId === "performance-testing" || moduleId === "performance") {
      if (pathname !== "/performance-testing") {
        router.push("/performance-testing");
      }
    } else {
      // In-dashboard module or route to root with module parameter
      if (pathname !== "/") {
        router.push(`/?module=${moduleId}`);
      }
    }

    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    setHoveredTooltip(null);
  };

  // Determine active item based on current pathname and activeModule
  const isItemActive = (itemId: NavModuleId) => {
    if (pathname === "/website-analysis" && itemId === "website-analysis") {
      return true;
    }
    if (
      pathname === "/requirements" &&
      (itemId === "requirements" || itemId === "system-requirements")
    ) {
      return true;
    }
    if (pathname === "/business-flows" && itemId === "business-flows") {
      return true;
    }
    if (
      (pathname === "/functional-qa" || pathname === "/test-cases") &&
      (itemId === "functional-qa" || itemId === "test-cases")
    ) {
      return true;
    }
    if (pathname === "/manual-qa" && itemId === "manual-qa") {
      return true;
    }
    if (
      pathname === "/defect-management" &&
      (itemId === "defect-management" || itemId === "bug-reports")
    ) {
      return true;
    }
    if (pathname === "/api-testing" && itemId === "api-testing") {
      return true;
    }
    if (pathname === "/playwright-automation" && itemId === "playwright-automation") {
      return true;
    }
    if (pathname === "/security-testing" && itemId === "security-testing") {
      return true;
    }
    if (
      pathname === "/performance-testing" &&
      (itemId === "performance-testing" || itemId === "performance")
    ) {
      return true;
    }
    return activeModule === itemId;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B132B] text-slate-200 border-r border-[#1C2541]/90 shadow-2xl transition-all duration-300 ease-in-out lg:static ${
          isCollapsed ? "w-20" : "w-72"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* 1. Brand Header */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-[#1C2541]/90 bg-[#0A1128]/70">
          <div
            onClick={() => {
              if (setActiveModule) setActiveModule("dashboard");
              if (pathname !== "/") router.push("/");
              if (isMobileOpen) setIsMobileOpen(false);
            }}
            className="flex items-center gap-3 overflow-hidden cursor-pointer group"
            title="QA Agent Hub - Return to Executive Dashboard"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <Bot className="h-5 w-5" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                  QA Agent Hub
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-xs">
                    PRO
                  </span>
                </span>
                <span className="text-xs text-slate-400 truncate">
                  Autonomous Quality Engine
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsProjectDropdownOpen(false);
              setHoveredTooltip(null);
            }}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2541] transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex lg:hidden items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2541] transition-colors"
            aria-label="Close mobile sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Active Project Selection Widget (Preserved across all route transitions) */}
        <div className="px-3 pt-3 pb-2 border-b border-[#1C2541]/70" ref={projectDropdownRef}>
          {!isCollapsed ? (
            <div className="relative">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  Active Project
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded-sm border border-emerald-800/40">
                  {activeProject.environment}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-[#1C2541]/60 hover:bg-[#1C2541] border border-slate-700/60 hover:border-blue-500/50 transition-all text-left shadow-xs group"
                title={`Active Project: ${activeProject.name} (${activeProject.domain})`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-600/30">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">
                      {activeProject.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {activeProject.domain}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isProjectDropdownOpen ? "rotate-180 text-blue-400" : ""
                  }`}
                />
              </button>

              {/* Project Dropdown Menu */}
              {isProjectDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-[#0A1128] border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Select Target Project
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                    {projects.map((proj) => {
                      const isSelected = proj.id === activeProjectId;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? "bg-blue-600/20 text-white border border-blue-500/40 font-medium"
                              : "text-slate-300 hover:bg-[#1C2541] hover:text-white"
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold truncate flex items-center gap-1.5">
                              {proj.name}
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-sm uppercase ${
                                  proj.environment === "Production"
                                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                                    : "bg-blue-950/80 text-blue-400 border border-blue-800/40"
                                }`}
                              >
                                {proj.environment}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 truncate">
                              {proj.domain}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Active Project Icon */
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({
                    id: "active-project-collapsed",
                    label: `Active: ${activeProject.name} (${activeProject.domain})`,
                    top: rect.top + rect.height / 2,
                  });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C2541]/70 hover:bg-[#1C2541] text-blue-400 border border-blue-500/30 transition-all hover:scale-105"
                aria-label={`Active Project: ${activeProject.name}`}
              >
                <Layers className="h-4.5 w-4.5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#0B132B]"></span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Executive Dashboard Quick Action */}
        <div className="px-3 pt-2">
          <button
            onClick={() => handleNavClick("dashboard")}
            onMouseEnter={(e) => {
              if (isCollapsed) {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredTooltip({
                  id: "executive-dashboard",
                  label: "Executive Dashboard",
                  top: rect.top + rect.height / 2,
                });
              }
            }}
            onMouseLeave={() => setHoveredTooltip(null)}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
              pathname === "/" && activeModule === "dashboard"
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1C2541]/60"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
            title={!isCollapsed ? "Overview & Health Metrics" : undefined}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
            {!isCollapsed && <span>Executive Dashboard</span>}
            {isCollapsed && pathname === "/" && activeModule === "dashboard" && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            )}
          </button>
        </div>

        {/* 4. Navigation Links: Exact 3 Professional Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-700/80 scrollbar-track-transparent">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed ? (
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
              ) : (
                <div className="flex justify-center py-1">
                  <div className="w-6 h-px bg-slate-700/60" />
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);
                  const verifiedCount = verifiedCounts[item.id];

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      onMouseEnter={(e) => {
                        if (isCollapsed) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredTooltip({
                            id: item.id,
                            label: item.label,
                            category: section.title,
                            count: verifiedCount,
                            top: rect.top + rect.height / 2,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                          : "text-slate-300 hover:bg-[#1C2541]/70 hover:text-white"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-cyan-300"
                        }`}
                      />

                      {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between overflow-hidden">
                          <span className="truncate text-left text-xs font-medium">
                            {item.label}
                          </span>

                          {/* Show verified count badge ONLY when verified data exists */}
                          {typeof verifiedCount === "number" && verifiedCount > 0 && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {verifiedCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Collapsed Active Bar Indicator */}
                      {isCollapsed && isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Footer Area: Autonomous QA Status */}
        <div className="p-3 border-t border-[#1C2541]/90 bg-[#0A1128]/80">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C2541]/50 border border-slate-700/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    Autonomous QA
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Shawon Ahmed • Lead QA
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 shrink-0">
                Online
              </span>
            </div>
          ) : (
            <div
              className="flex justify-center p-1 cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredTooltip({
                  id: "footer-status",
                  label: "Autonomous QA Engine • Online",
                  top: rect.top + rect.height / 2,
                });
              }}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Tooltips in Collapsed Mode (Zero clipping by scroll containers) */}
      {isCollapsed && hoveredTooltip && (
        <div
          style={{ top: hoveredTooltip.top }}
          className="fixed left-20 -translate-y-1/2 ml-2.5 z-50 pointer-events-none flex items-center animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="relative rounded-lg bg-[#0A1128] px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-2xl border border-slate-700/90 whitespace-nowrap flex items-center gap-2">
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0A1128]" />
            <div className="flex flex-col">
              {hoveredTooltip.category && (
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  {hoveredTooltip.category}
                </span>
              )}
              <span className="flex items-center gap-2 text-white">
                {hoveredTooltip.label}
                {typeof hoveredTooltip.count === "number" && hoveredTooltip.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                    {hoveredTooltip.count}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
