import { supabase } from "@/lib/supabase/client";
import { ProjectOption } from "@/lib/projects/projectState";
import { BugReport, BugSeverity, BugPriority, BugLifecycleStatus } from "@/types/defect-management";
import { Json } from "@/types/supabase";

/**
 * Generates initial realistic bugs for default projects if none exist in database
 */
export function generateDefaultBugs(project: ProjectOption): BugReport[] {
  const now = new Date().toISOString();
  return [
    {
      id: `bug_${project.id.slice(0, 8)}_001`,
      projectId: project.id,
      testCaseCode: "TC-E2E-003",
      title: "Unhandled 500 error when applying expired coupon code at final payment step",
      description:
        "When an expired discount code is submitted during checkout review, the client UI crashes with a blank screen rather than displaying an inline warning banner.",
      severity: "high",
      priority: "high",
      status: "open",
      reproductionSteps: [
        { stepNumber: 1, description: "Navigate to shopping cart with at least 1 item." },
        { stepNumber: 2, description: "Proceed to Checkout and fill out billing information." },
        { stepNumber: 3, description: "In the 'Coupon Code' input, enter 'EXPIRED_PROMO_2025'." },
        { stepNumber: 4, description: "Click 'Apply Discount' button." },
      ],
      expectedResult: "System validates promo code and displays amber alert 'Coupon expired or invalid'. Cart total remains unchanged.",
      actualResult: "Client makes POST /api/promo and receives 500 Internal Server Error. Web page throws Uncaught TypeError.",
      environment: project.environment || "Staging",
      reportedBy: "Shawon Ahmed",
      assignee: "Backend Team",
      evidenceUrls: [
        {
          id: "ev_1",
          type: "log",
          title: "Browser Network Response Log",
          content: "HTTP 500 Internal Server Error: { error: 'NullPointerException in DiscountService.java:84' }",
          uploadedAt: now,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: `bug_${project.id.slice(0, 8)}_002`,
      projectId: project.id,
      testCaseCode: "TC-API-002",
      title: "Rate limiting header missing on public authentication endpoint",
      description:
        "The /api/v1/auth/login endpoint does not emit X-RateLimit headers or return 429 Too Many Requests when subjected to high-frequency requests.",
      severity: "critical",
      priority: "critical",
      status: "in_progress",
      reproductionSteps: [
        { stepNumber: 1, description: "Send 50 rapid POST requests to /api/v1/auth/login with invalid password." },
        { stepNumber: 2, description: "Inspect response HTTP headers and status codes." },
      ],
      expectedResult: "System triggers IP throttle after 5 consecutive failed attempts and returns HTTP 429.",
      actualResult: "All 50 attempts return HTTP 401 without rate limit throttling.",
      environment: project.environment || "Staging",
      reportedBy: "Shawon Ahmed",
      assignee: "Security QA Lead",
      evidenceUrls: [
        {
          id: "ev_2",
          type: "log",
          title: "k6 Stress Output Trace",
          content: "Executed 50 iterations with zero 429 status codes returned across 10 seconds.",
          uploadedAt: now,
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: `bug_${project.id.slice(0, 8)}_003`,
      projectId: project.id,
      testCaseCode: "TC-SEC-001",
      title: "Session token remains valid in local storage after user clicks Log Out",
      description:
        "Clicking the Log Out button redirects the user to the landing page, but the session JWT stored in localStorage is not invalidated on the server.",
      severity: "medium",
      priority: "medium",
      status: "resolved",
      reproductionSteps: [
        { stepNumber: 1, description: "Log in with test credentials." },
        { stepNumber: 2, description: "Click 'Sign Out' in account menu." },
        { stepNumber: 3, description: "Extract previous bearer token from storage and make curl request." },
      ],
      expectedResult: "API rejects prior token with HTTP 401 Unauthorized.",
      actualResult: "API accepts previous token until natural expiration timestamp (24 hours).",
      environment: project.environment || "Staging",
      reportedBy: "Shawon Ahmed",
      assignee: "Identity & Access Team",
      evidenceUrls: [],
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];
}

/**
 * Fetch bugs for active project from Supabase
 */
export async function fetchProjectBugs(project: ProjectOption): Promise<BugReport[]> {
  try {
    const { data, error } = await supabase
      .from("bugs")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not query bugs from Supabase:", error.message);
    }

    if (data && data.length > 0) {
      return data.map((b) => {
        let parsedSteps: BugReport["reproductionSteps"] = [];
        if (Array.isArray(b.reproduction_steps)) {
          parsedSteps = (b.reproduction_steps as unknown[]).map((step, idx) => {
            if (typeof step === "string") {
              return { stepNumber: idx + 1, description: step };
            }
            const rec = step as Record<string, unknown>;
            return {
              stepNumber: (rec.stepNumber as number) || idx + 1,
              description: (rec.description as string) || "Execute reproduction step",
            };
          });
        }

        const evidence = (Array.isArray(b.evidence_urls)
          ? (b.evidence_urls as unknown[])
          : []) as BugReport["evidenceUrls"];

        return {
          id: b.id,
          projectId: b.project_id,
          testCaseId: b.test_case_id,
          testCaseCode: b.test_case_code || undefined,
          runId: b.run_id,
          testResultId: b.test_result_id,
          title: b.title,
          description: b.description,
          severity: (b.severity as BugSeverity) || "medium",
          priority: (b.priority as BugPriority) || "medium",
          status: (b.status as BugLifecycleStatus) || "open",
          reproductionSteps: parsedSteps,
          expectedResult: b.expected_result || undefined,
          actualResult: b.actual_result || undefined,
          environment: b.environment || project.environment || "Staging",
          reportedBy: b.reported_by || "Shawon Ahmed",
          assignee: b.assignee || "Unassigned",
          evidenceUrls: evidence,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        };
      });
    }

    // Supabase has no bugs: Return realistic initial defaults
    return generateDefaultBugs(project);
  } catch (err) {
    console.error("Error in fetchProjectBugs:", err);
    return generateDefaultBugs(project);
  }
}

/**
 * Creates a new Bug Report in Supabase
 */
export async function createBugReport(
  project: ProjectOption,
  data: Omit<BugReport, "id" | "projectId" | "createdAt" | "updatedAt">
): Promise<BugReport> {
  const now = new Date().toISOString();
  const bugId = crypto.randomUUID();

  const newBug: BugReport = {
    ...data,
    id: bugId,
    projectId: project.id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await supabase.from("bugs").insert({
      id: newBug.id,
      project_id: newBug.projectId,
      test_case_id: newBug.testCaseId || null,
      test_case_code: newBug.testCaseCode || null,
      run_id: newBug.runId || null,
      test_result_id: newBug.testResultId || null,
      title: newBug.title,
      description: newBug.description,
      severity: newBug.severity,
      priority: newBug.priority,
      status: newBug.status,
      reproduction_steps: newBug.reproductionSteps as unknown as Json,
      expected_result: newBug.expectedResult || null,
      actual_result: newBug.actualResult || null,
      environment: newBug.environment || project.environment,
      reported_by: newBug.reportedBy,
      assignee: newBug.assignee,
      evidence_urls: newBug.evidenceUrls as unknown as Json,
    });
  } catch (err) {
    console.warn("Could not insert bug report to Supabase (using memory state):", err);
  }

  return newBug;
}

/**
 * Updates an existing bug's status or details in Supabase
 */
export async function updateBugStatus(
  bugId: string,
  newStatus: BugLifecycleStatus
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await supabase
      .from("bugs")
      .update({
        status: newStatus,
        updated_at: now,
      })
      .eq("id", bugId);
  } catch (err) {
    console.warn("Could not update bug status in Supabase:", err);
  }
}

/**
 * Exports Bug Reports to Markdown, CSV, or JSON
 */
export function exportBugsToFile(
  bugs: BugReport[],
  project: ProjectOption,
  format: "markdown" | "csv" | "json"
): void {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `Defect-Report-${project.name.replace(/\s+/g, "_")}-${timestamp}`;

  if (format === "markdown") {
    let md = `# QA Defect & Bug Report\n\n`;
    md += `**Project:** ${project.name} (${project.domain})\n`;
    md += `**Environment:** ${project.environment || "Staging"}\n`;
    md += `**Generated By:** Shawon Ahmed (Lead QA Architect)\n`;
    md += `**Generated At:** ${new Date().toUTCString()}\n`;
    md += `**Total Defects:** ${bugs.length}\n\n`;

    md += `| Defect ID | Title | Linked Test Case | Severity | Priority | Status | Assignee |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    bugs.forEach((b) => {
      md += `| ${b.id.slice(0, 8)} | ${b.title.replace(/\|/g, "\\|")} | ${b.testCaseCode || "N/A"} | **${b.severity.toUpperCase()}** | ${b.priority.toUpperCase()} | \`${b.status.toUpperCase()}\` | ${b.assignee} |\n`;
    });

    md += `\n---\n\n## Detailed Reproduction Steps & Observations\n\n`;
    bugs.forEach((b, idx) => {
      md += `### ${idx + 1}. [${b.id.slice(0, 8)}] ${b.title}\n`;
      md += `- **Severity:** ${b.severity} | **Priority:** ${b.priority} | **Status:** ${b.status}\n`;
      md += `- **Reported By:** ${b.reportedBy} | **Assignee:** ${b.assignee}\n`;
      if (b.testCaseCode) md += `- **Linked Test Case:** ${b.testCaseCode}\n`;
      md += `\n**Description:**\n${b.description}\n\n`;
      if (b.reproductionSteps.length > 0) {
        md += `**Reproduction Steps:**\n`;
        b.reproductionSteps.forEach((s) => {
          md += `${s.stepNumber}. ${s.description}\n`;
        });
        md += `\n`;
      }
      if (b.expectedResult) md += `**Expected Result:** ${b.expectedResult}\n`;
      if (b.actualResult) md += `**Actual Result:** ${b.actualResult}\n`;
      md += `\n---\n\n`;
    });

    downloadBlob(md, `${filename}.md`, "text/markdown");
  } else if (format === "csv") {
    const headers = [
      "Bug ID",
      "Title",
      "Severity",
      "Priority",
      "Status",
      "Linked Test Case",
      "Assignee",
      "Reported By",
      "Environment",
      "Created At",
    ];
    const rows = bugs.map((b) => [
      `"${b.id}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.severity}"`,
      `"${b.priority}"`,
      `"${b.status}"`,
      `"${b.testCaseCode || "N/A"}"`,
      `"${b.assignee}"`,
      `"${b.reportedBy}"`,
      `"${b.environment || ""}"`,
      `"${b.createdAt}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadBlob(csvContent, `${filename}.csv`, "text/csv");
  } else if (format === "json") {
    const jsonContent = JSON.stringify(
      {
        project: project.name,
        domain: project.domain,
        generatedBy: "Shawon Ahmed",
        exportedAt: new Date().toISOString(),
        totalBugs: bugs.length,
        defects: bugs,
      },
      null,
      2
    );
    downloadBlob(jsonContent, `${filename}.json`, "application/json");
  }
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
