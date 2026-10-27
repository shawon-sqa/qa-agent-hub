"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/client";

export interface ProjectOption {
  id: string;
  name: string;
  domain: string;
  environment: "Production" | "Staging" | "Dev";
  status?: string;
  passRate?: number;
}

export const DEFAULT_PROJECTS: ProjectOption[] = [
  {
    id: "proj_opsroi_prod",
    name: "OpsROI Cloud Production",
    domain: "app.opsroi.com",
    environment: "Production",
    status: "Passed",
    passRate: 98.4,
  },
  {
    id: "proj_fintech_portal",
    name: "FinTech Payments Gateway",
    domain: "pay.fintechcloud.io",
    environment: "Staging",
    status: "Passed",
    passRate: 94.2,
  },
  {
    id: "proj_daraz_bd",
    name: "Daraz Bangladesh Marketplace",
    domain: "daraz.com.bd",
    environment: "Production",
    status: "Warning",
    passRate: 88.7,
  },
];

const STORAGE_KEY = "qa_agent_hub_active_project_id";
const EVENT_NAME = "qa_agent_hub_project_changed";

/**
 * Read the current active project ID from localStorage safely.
 */
export function getActiveProjectId(): string {
  if (typeof window === "undefined") {
    return DEFAULT_PROJECTS[0].id;
  }
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PROJECTS[0].id;
}

/**
 * Set the active project ID and notify all listeners across the app.
 */
export function setActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: id }));
}

/**
 * Subscribe helper for external store / event listener.
 */
function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * React hook to access and update the active project state.
 * Preserves selection across all route transitions and synchronizes with Supabase.
 */
export function useActiveProject() {
  const activeProjectId = useSyncExternalStore(
    subscribe,
    getActiveProjectId,
    () => DEFAULT_PROJECTS[0].id
  );

  const [projects, setProjects] = useState<ProjectOption[]>(DEFAULT_PROJECTS);
  const [loading, setLoading] = useState(false);

  // Fetch real projects from Supabase if connected
  useEffect(() => {
    let isMounted = true;
    async function fetchSupabaseProjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, domain, environment, status");

        if (!error && data && data.length > 0 && isMounted) {
          const supabaseProjects: ProjectOption[] = data.map((p) => ({
            id: p.id,
            name: p.name,
            domain: p.domain || "qa-agent-hub.local",
            environment: (p.environment as "Production" | "Staging" | "Dev") || "Production",
            status: p.status || "Active",
          }));

          // Merge without duplicates
          const merged = [...supabaseProjects];
          for (const def of DEFAULT_PROJECTS) {
            if (!merged.some((m) => m.id === def.id || m.domain === def.domain)) {
              merged.push(def);
            }
          }
          setProjects(merged);
        }
      } catch {
        // Fall back gracefully to DEFAULT_PROJECTS
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSupabaseProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ||
    DEFAULT_PROJECTS.find((p) => p.id === activeProjectId) ||
    projects[0] ||
    DEFAULT_PROJECTS[0];

  return {
    activeProjectId,
    activeProject,
    projects,
    setActiveProjectId,
    loading,
  };
}
