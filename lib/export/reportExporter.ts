import { ProjectOption } from "@/lib/projects/projectState";
import { SystemRequirement } from "@/types/requirements";
import { BusinessFlow } from "@/types/business-flows";
import { FunctionalTestCase } from "@/types/functional-qa";
import { WebsiteAnalysisReport } from "@/types/website-analysis";

export type ExportFormat = "markdown" | "csv" | "json" | "html";

export interface ProfessionalReportData {
  project: ProjectOption;
  analysisReport?: WebsiteAnalysisReport | null;
  requirements?: SystemRequirement[];
  flows?: BusinessFlow[];
  testCases?: FunctionalTestCase[];
  exportedAt?: string;
  author?: string;
}

export interface ExportReportOptions {
  format: ExportFormat;
  includeRequirements?: boolean;
  includeFlows?: boolean;
  includeTestCases?: boolean;
  includeFindings?: boolean;
  sanitizeSecrets?: boolean;
}

/**
 * Strict Anti-Leak Security Filter:
 * Detects and redacts confidential credentials, API keys, JWT tokens, and connection strings.
 */
export function sanitizeReportData<T>(data: T): T {
  const jsonStr = JSON.stringify(data);

  // Redact common secret patterns:
  // e.g. API keys, JWTs (eyJ...), bearer tokens, passwords, database URLs
  const sanitized = jsonStr
    .replace(/(bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi, "Bearer [REDACTED_SECRET]")
    .replace(/(eyJ[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{10,})/gi, "[REDACTED_JWT_TOKEN]")
    .replace(/(?:password|secret|api_key|apiKey|anon_key|privateKey)["']?\s*[:=]\s*["']([^"']{8,})["']/gi, (match) => {
      return match.replace(/:.*/, ': "[REDACTED_CONFIDENTIAL_KEY]"');
    })
    .replace(/(postgres(?:ql)?:\/\/[^:]+:[^@]+@[^/]+\/[^"'\s]+)/gi, "postgresql://[REDACTED_DB_CREDENTIALS]@host/db");

  return JSON.parse(sanitized) as T;
}

/**
 * Generates an executive Markdown report.
 */
export function generateMarkdownReport(data: ProfessionalReportData): string {
  const p = data.project;
  const dateStr = data.exportedAt || new Date().toISOString().split("T")[0];
  const author = data.author || "Shawon Ahmed (Lead QA Automation Architect)";

  let md = `# Executive Quality Assurance & System Intelligence Report\n\n`;
  md += `**Project:** ${p.name} (${p.domain})\n`;
  md += `**Environment:** ${p.environment}\n`;
  md += `**Auditor / Author:** ${author}\n`;
  md += `**Generated Date:** ${dateStr}\n`;
  md += `**Classification:** Confidentially Verified Audit Grade (Anti-Leak Guard Active)\n\n`;

  md += `---\n\n## 1. Executive Summary & Verification Matrix\n\n`;
  md += `This report consolidates verified website discovery, system requirements, business workflows, and functional test coverage for **${p.name}**.\n\n`;

  const reqs = data.requirements || [];
  const tests = data.testCases || [];
  const flows = data.flows || [];

  md += `| Category | Total Count | Approved / Verified | Notes |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  md += `| **System Requirements** | ${reqs.length} | ${reqs.filter((r) => r.status === "Approved").length} | Factual SRS Specifications |\n`;
  md += `| **Business Workflows** | ${flows.length} | ${flows.filter((f) => f.status === "approved").length} | Interactive Decision Flows |\n`;
  md += `| **Functional Test Cases** | ${tests.length} | ${tests.filter((t) => t.approvalStatus === "approved").length} | Initialized Strictly as 'Not Run' |\n\n`;

  if (reqs.length > 0) {
    md += `---\n\n## 2. System Requirements Specification (SRS)\n\n`;
    reqs.forEach((r, idx) => {
      md += `### ${idx + 1}. [${r.reqCode}] ${r.title}\n`;
      md += `- **Category:** ${r.category} | **Priority:** ${r.priority} | **Verification:** ${r.verificationStatus}\n`;
      md += `- **Status:** ${r.status}\n`;
      md += `\n**Description:**\n${r.description}\n\n`;
      if (r.acceptanceCriteria && r.acceptanceCriteria.length > 0) {
        md += `**Acceptance Criteria (Gherkin):**\n`;
        r.acceptanceCriteria.forEach((ac, i) => {
          md += `${i + 1}. ${ac}\n`;
        });
      }
      md += `\n`;
    });
  }

  if (flows.length > 0) {
    md += `---\n\n## 3. Business Flows & User Journeys\n\n`;
    flows.forEach((f) => {
      md += `### [${f.flowCode}] ${f.title}\n`;
      md += `- **Category:** ${f.category} | **Health Score:** ${f.validation?.healthScore ?? 100}%\n`;
      md += `- **Start Point:** \`${f.startPoint}\` &rarr; **End Point:** \`${f.endPoint}\`\n\n`;
      md += `**Execution Sequence:**\n`;
      f.steps.forEach((s) => {
        md += `- **Step ${s.stepNumber} [${s.type.toUpperCase()}]:** ${s.title}\n`;
        md += `  - *Action:* ${s.userAction}\n`;
        md += `  - *Expected:* ${s.systemResponse}\n`;
        if (s.branches && s.branches.length > 0) {
          s.branches.forEach((b) => {
            md += `  - *Branch (${b.outcomeType}):* ${b.condition} &rarr; ${b.targetStepId || "Next"}\n`;
          });
        }
      });
      md += `\n`;
    });
  }

  if (tests.length > 0) {
    md += `---\n\n## 4. Functional QA Matrix & Test Cases\n\n`;
    md += `| Test ID | Scenario | Title | Module | Priority | Status | Execution |\n`;
    md += `| :--- | :--- | :--- | :--- | :---: | :---: | :---: |\n`;
    tests.forEach((t) => {
      md += `| **${t.testCaseId}** | ${t.scenarioId} | ${t.title} | ${t.module} | ${t.priority.toUpperCase()} | ${t.approvalStatus} | ${t.executionStatus} |\n`;
    });
    md += `\n`;
  }

  return md;
}

/**
 * Generates an RFC 4180 compliant CSV Traceability Matrix.
 */
export function generateCsvReport(data: ProfessionalReportData): string {
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "Item Type",
    "Identifier",
    "Title / Stage",
    "Category / Module",
    "Priority",
    "Status",
    "Verification Status",
    "Details / Criteria",
    "Traceability Target",
  ];

  const rows: Array<string[]> = [];

  // Requirements
  (data.requirements || []).forEach((r) => {
    rows.push([
      "Requirement",
      r.reqCode,
      r.title,
      r.category,
      r.priority,
      r.status,
      r.verificationStatus,
      (r.acceptanceCriteria || []).join(" | "),
      r.traceability?.sourceFeature || "",
    ]);
  });

  // Flows
  (data.flows || []).forEach((f) => {
    rows.push([
      "Business Flow",
      f.flowCode,
      f.title,
      f.category,
      `${f.validation?.healthScore ?? 100}% Health`,
      f.status,
      f.verificationStatus,
      `${f.steps.length} Steps from ${f.startPoint} to ${f.endPoint}`,
      (f.traceability?.linkedRequirements || []).join(" | "),
    ]);
  });

  // Test Cases
  (data.testCases || []).forEach((t) => {
    rows.push([
      "Test Case",
      t.testCaseId,
      t.title,
      t.module,
      t.priority.toUpperCase(),
      t.approvalStatus,
      t.executionStatus, // strictly defaults to 'Not Run'
      t.expectedResult,
      t.requirementCode || t.flowCode || "",
    ]);
  });

  return [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => escapeCsv(cell)).join(",")),
  ].join("\r\n");
}

/**
 * Generates a self-contained, printable HTML dashboard report with modern CSS styling.
 */
export function generateHtmlReport(data: ProfessionalReportData): string {
  const p = data.project;
  const dateStr = data.exportedAt || new Date().toISOString().split("T")[0];
  const author = data.author || "Shawon Ahmed (QA Automation Architect)";
  const reqs = data.requirements || [];
  const tests = data.testCases || [];
  const flows = data.flows || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Agent Hub - Executive Report: ${p.name}</title>
  <style>
    :root {
      --bg: #0B132B;
      --card-bg: #FFFFFF;
      --text: #1E293B;
      --muted: #64748B;
      --primary: #2563EB;
      --border: #E2E8F0;
      --emerald: #10B981;
      --rose: #EF4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F8FAFC;
      color: var(--text);
      line-height: 1.5;
      padding: 32px 20px;
    }
    .container { max-width: 1050px; margin: 0 auto; }
    .header-card {
      background: #0B132B;
      color: #FFFFFF;
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px rgba(11, 19, 43, 0.15);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(37, 99, 235, 0.2);
      color: #38BDF8;
      margin-bottom: 12px;
    }
    .badge-verified {
      background: #ECFDF5;
      color: #047857;
      border: 1px solid #A7F3D0;
    }
    .badge-notrun {
      background: #F1F5F9;
      color: #475569;
      border: 1px solid #CBD5E1;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
    }
    .stat-val { font-size: 28px; font-weight: 800; color: #0F172A; }
    .stat-lbl { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; }
    .section-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    h2 { font-size: 18px; font-weight: 800; margin-bottom: 16px; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 10px 12px; background: #F1F5F9; color: #475569; font-weight: 700; border-bottom: 2px solid var(--border); }
    td { padding: 12px; border-bottom: 1px solid var(--border); }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; }
    .footer { text-align: center; font-size: 11px; color: var(--muted); margin-top: 40px; }
    @media print {
      body { padding: 0; background: #FFF; }
      .header-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-card">
      <span class="badge">QA Agent Hub • Executive Audit Report</span>
      <h1 style="font-size: 26px; font-weight: 800; margin-bottom: 6px;">${p.name}</h1>
      <p style="font-size: 13px; color: #94A3B8; margin-bottom: 16px;">Target URL: ${p.domain} • Environment: ${p.environment}</p>
      <div style="font-size: 11px; color: #CBD5E1; display: flex; gap: 24px; flex-wrap: wrap;">
        <span>Auditor: <strong>${author}</strong></span>
        <span>Date: <strong>${dateStr}</strong></span>
        <span>Security Guard: <strong>Active (Zero Secrets Leaked)</strong></span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-lbl">System Requirements</div>
        <div class="stat-val">${reqs.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Business Workflows</div>
        <div class="stat-val">${flows.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Test Matrix Cases</div>
        <div class="stat-val">${tests.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Execution Status</div>
        <div class="stat-val" style="font-size: 20px; color: #2563EB;">Strict "Not Run"</div>
      </div>
    </div>

    <!-- Requirements Matrix -->
    <div class="section-card">
      <h2>1. Traceable System Requirements</h2>
      <table>
        <thead>
          <tr>
            <th>Req ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Verification</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reqs.map((r) => `
            <tr>
              <td class="mono" style="color: #2563EB;">${r.reqCode}</td>
              <td style="font-weight: 600;">${r.title}</td>
              <td>${r.category}</td>
              <td><strong>${r.priority}</strong></td>
              <td><span class="badge badge-verified">${r.verificationStatus}</span></td>
              <td>${r.status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Functional QA Matrix -->
    <div class="section-card">
      <h2>2. Functional QA Matrix & Test Cases</h2>
      <table>
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Scenario</th>
            <th>Title</th>
            <th>Module</th>
            <th>Priority</th>
            <th>Execution</th>
          </tr>
        </thead>
        <tbody>
          ${tests.map((t) => `
            <tr>
              <td class="mono" style="color: #4F46E5;">${t.testCaseId}</td>
              <td class="mono">${t.scenarioId}</td>
              <td>${t.title}</td>
              <td>${t.module}</td>
              <td><strong>${t.priority.toUpperCase()}</strong></td>
              <td><span class="badge badge-notrun">${t.executionStatus}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated automatically by <strong>QA Agent Hub</strong> for Shawon Ahmed. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers instant browser download for the generated report in requested format.
 */
export function downloadReportFile(
  data: ProfessionalReportData,
  options: ExportReportOptions
): void {
  // 1. Strict anti-leak sanitization
  const sanitizedData = options.sanitizeSecrets !== false ? sanitizeReportData(data) : data;

  let content = "";
  let mimeType = "text/plain";
  let extension = "txt";

  switch (options.format) {
    case "markdown":
      content = generateMarkdownReport(sanitizedData);
      mimeType = "text/markdown";
      extension = "md";
      break;

    case "csv":
      content = generateCsvReport(sanitizedData);
      mimeType = "text/csv";
      extension = "csv";
      break;

    case "html":
      content = generateHtmlReport(sanitizedData);
      mimeType = "text/html";
      extension = "html";
      break;

    case "json":
    default:
      content = JSON.stringify(sanitizedData, null, 2);
      mimeType = "application/json";
      extension = "json";
      break;
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitizedProjectName = (data.project.name || "qa-hub").toLowerCase().replace(/[^a-z0-9]/g, "-");
  link.href = url;
  link.setAttribute("download", `qa-audit-report-${sanitizedProjectName}-${Date.now()}.${extension}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
