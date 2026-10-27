import { QaPromptDomainId, PromptContextData, QA_PROMPT_DOMAINS } from "@/types/ai-prompt";

/**
 * Synthesizes an enterprise-grade AI QA Prompt tailored to a specific QA domain and project context.
 */
export function synthesizeQaPrompt(
  domainId: QaPromptDomainId,
  context: PromptContextData,
  options?: {
    modelTarget?: string;
    includeCodeBoilerplate?: boolean;
    strictAntiFabrication?: boolean;
  }
): string {
  const domainInfo = QA_PROMPT_DOMAINS.find((d) => d.id === domainId);
  const targetUrl = context.targetUrl || (context.domain ? `https://${context.domain}` : "https://app.example.com");
  const businessType = context.businessType || "Web Application / SaaS";
  const projectName = context.projectName || "Enterprise Quality Workspace";
  const model = options?.modelTarget || domainInfo?.recommendedModel || "Claude 3.5 Sonnet / Gemini 1.5 Pro";

  const featuresText =
    context.features && context.features.length > 0
      ? context.features.map((f, i) => `   ${i + 1}. ${f}`).join("\n")
      : "   1. Authentication & Session Security\n   2. Core Business Workflow & Data Operations\n   3. Account Management & Access Controls";

  const workflowText =
    context.workflowStages && context.workflowStages.length > 0
      ? context.workflowStages.map((s, i) => `   Stage ${i + 1}: ${s}`).join("\n")
      : "   Stage 1: User Inbound Entry\n   Stage 2: Core Action & Transaction Processing\n   Stage 3: Confirmation & Audit Telemetry";

  const reqText =
    context.requirements && context.requirements.length > 0
      ? context.requirements.slice(0, 5).map((r) => `   - [${r.reqCode}] ${r.title}`).join("\n")
      : "   - [REQ-FUNC-001] Primary Workflow Execution\n   - [REQ-SEC-001] Security Access Controls & Session Validation";

  // Base prompt header with Lead QA Persona
  let prompt = `You are acting as an elite Principal QA Automation Lead and Quality Architect pair programming with Shawon Ahmed for QA Agent Hub.\n`;
  prompt += `Target Environment: ${projectName} (${targetUrl})\n`;
  prompt += `Domain Category: ${businessType}\n`;
  prompt += `Recommended LLM Engine: ${model}\n`;
  prompt += `Timestamp: ${new Date().toISOString().split("T")[0]}\n\n`;

  prompt += `================================================================================\n`;
  prompt += `MISSION: ${domainInfo?.title.toUpperCase()}\n`;
  prompt += `================================================================================\n\n`;

  // Specific domain directives
  switch (domainId) {
    case "exploratory":
      prompt += `### 1. EXPLORATORY CHARTER OBJECTIVE\n`;
      prompt += `Execute a comprehensive 60-minute unscripted exploratory testing tour on ${targetUrl}.\n`;
      prompt += `Focus on uncovering functional ambiguities, edge-case UI states, and unhandled network errors.\n\n`;
      prompt += `### 2. SYSTEM CONTEXT & ACTIVE WORKFLOWS\n`;
      prompt += `Discovered Major Features:\n${featuresText}\n\n`;
      prompt += `Primary User Workflow Progression:\n${workflowText}\n\n`;
      prompt += `### 3. EXPLORATORY HEURISTICS & DELIVERABLES\n`;
      prompt += `Apply the SFDPO (Structure, Function, Data, Platform, Operations) model. Deliver:\n`;
      prompt += `1. **Time-boxed Charters**: 3 distinct 20-minute charters focusing on: (a) Input Stress, (b) State Interruption, (c) Session Tampering.\n`;
      prompt += `2. **Tour Heuristics**: Detailed notes for The Bad Neighborhood Tour (high-risk areas) and The Supermodel Tour (UI/UX superficial checks).\n`;
      prompt += `3. **Defect Log Template**: Structured defect format (Observed vs Expected, Severity, Repro Steps, Browser DevTools network logs).\n`;
      break;

    case "playwright_e2e":
      prompt += `### 1. PLAYWRIGHT AUTOMATION OBJECTIVE\n`;
      prompt += `Engineer robust, production-grade TypeScript Playwright test suites for ${targetUrl}.\n`;
      prompt += `Follow Page Object Model (POM) architecture with zero hardcoded sleep timers.\n\n`;
      prompt += `### 2. SYSTEM CONTEXT & REQUIREMENTS\n`;
      prompt += `Linked Requirements:\n${reqText}\n\n`;
      prompt += `Target Workflow Steps:\n${workflowText}\n\n`;
      prompt += `### 3. TECHNICAL SPECIFICATIONS & DELIVERABLES\n`;
      prompt += `Provide modular TypeScript code including:\n`;
      prompt += `1. **Page Object Models**: Dedicated class for each route with typed locators using role/test-id selectors (e.g. page.getByRole()).\n`;
      prompt += `2. **End-to-End Test Suite**: Complete test cases covering:\n`;
      prompt += `   - Happy Path execution with web assertions (\`expect(locator).toBeVisible()\`).\n`;
      prompt += `   - Negative validation challenge (invalid input rejection & error toast verification).\n`;
      prompt += `   - Responsive layout execution (mobile viewport vs desktop).\n`;
      prompt += `3. **Playwright Config**: Configuration snippet with base URL, retries, trace on failure, and video recording.\n`;
      break;

    case "api_testing":
      prompt += `### 1. API TESTING OBJECTIVE\n`;
      prompt += `Construct an exhaustive API test matrix and Postman/Newman collection for backend endpoints powering ${targetUrl}.\n\n`;
      prompt += `### 2. CONTEXT & FUNCTIONAL SCOPE\n`;
      prompt += `System Features:\n${featuresText}\n\n`;
      prompt += `### 3. DELIVERABLES\n`;
      prompt += `Deliver an enterprise API validation plan:\n`;
      prompt += `1. **Endpoint Matrix**: Method, Route, Headers, Payload Schema, Expected Status Codes (200, 201, 400, 401, 403, 429, 500).\n`;
      prompt += `2. **JSON Schema Validation**: Strict JSON schema assertions checking types, required keys, and UUID/timestamp formats.\n`;
      prompt += `3. **Postman Test Scripts**: Executable JavaScript snippets checking response time (< 350ms), status code, and bearer token propagation.\n`;
      break;

    case "security_owasp":
      prompt += `### 1. SECURITY AUDIT OBJECTIVE\n`;
      prompt += `Perform a rigorous web application security vulnerability assessment for ${targetUrl} adhering to OWASP Top 10.\n\n`;
      prompt += `### 2. SCOPE & SENSITIVE PATHWAYS\n`;
      prompt += `Linked Security Requirements:\n${reqText}\n\n`;
      prompt += `### 3. SECURITY TEST VECTORS & CHECKLIST\n`;
      prompt += `Provide concrete penetration vectors and audit checks for:\n`;
      prompt += `1. **Broken Access Control (A01:2021)**: IDOR test cases on tenant resources, role privilege escalation.\n`;
      prompt += `2. **Cryptographic Failures (A02:2021)**: TLS 1.3 verification, HSTS header preload, sensitive data in URL query strings.\n`;
      prompt += `3. **Injection Defenses (A03:2021)**: Cross-Site Scripting (XSS) input sanitization on search/forms, SQL injection boundary strings.\n`;
      prompt += `4. **Security Misconfiguration (A05:2021)**: Content Security Policy (CSP), X-Frame-Options framing defenses, CORS wildcard allowlists.\n`;
      break;

    case "performance_k6":
      prompt += `### 1. LOAD & STRESS TESTING OBJECTIVE\n`;
      prompt += `Author high-throughput k6 performance load test scripts targeting ${targetUrl}.\n\n`;
      prompt += `### 2. WORKFLOW TO BENCHMARK\n`;
      prompt += `Key User Workflow:\n${workflowText}\n\n`;
      prompt += `### 3. DELIVERABLES & THRESHOLDS\n`;
      prompt += `Provide complete k6 JavaScript script:\n`;
      prompt += `1. **Execution Stages**: 1m ramp up to 100 Virtual Users (VUs), 3m soak at 250 VUs, 1m ramp down.\n`;
      prompt += `2. **Performance Thresholds**: \`http_req_duration: ['p(95)<400', 'p(99)<800']\`, \`http_req_failed: ['rate<0.01']\`.\n`;
      prompt += `3. **Custom Metrics**: Trend metrics for individual API calls and transaction step durations.\n`;
      break;

    case "accessibility_wcag":
      prompt += `### 1. WCAG 2.1 AA ACCESSIBILITY AUDIT OBJECTIVE\n`;
      prompt += `Audit ${targetUrl} for compliance with WCAG 2.1 Level AA and Section 508 accessibility guidelines.\n\n`;
      prompt += `### 2. DELIVERABLES\n`;
      prompt += `Deliver an actionable accessibility evaluation covering:\n`;
      prompt += `1. **Perceivable**: Text alternatives (alt text), color contrast ratios (>= 4.5:1 for normal text, >= 3:1 for large), semantic heading hierarchy.\n`;
      prompt += `2. **Operable**: Full keyboard accessibility (Tab order, focus trapping inside modals, visible focus indicators, skip-to-content links).\n`;
      prompt += `3. **Understandable & Robust**: Form label associations, ARIA live regions for async state updates, screen reader compatibility table.\n`;
      break;

    case "boundary_edge":
      prompt += `### 1. BOUNDARY VALUE & EDGE CASE ANALYSIS OBJECTIVE\n`;
      prompt += `Perform exhaustive equivalence partitioning and boundary value analysis (BVA) for all input fields across ${targetUrl}.\n\n`;
      prompt += `### 2. SCOPE\n`;
      prompt += `Target Features:\n${featuresText}\n\n`;
      prompt += `### 3. TEST MATRICES\n`;
      prompt += `Provide boundary test tables with:\n`;
      prompt += `1. Minimum, min-1, nominal, max, max+1 values for numerical/length fields.\n`;
      prompt += `2. Special characters, SQL meta-characters, multi-byte UTF-8 emojis, and zero-width spaces.\n`;
      prompt += `3. Concurrency edge cases (double-click on submission buttons, simultaneous checkout on last inventory unit).\n`;
      break;

    case "negative_chaos":
      prompt += `### 1. NEGATIVE & CHAOS RESILIENCE QA OBJECTIVE\n`;
      prompt += `Subject the platform architecture at ${targetUrl} to negative fault injection and unexpected environmental conditions.\n\n`;
      prompt += `### 2. CHAOS VECTORS & VERIFICATION\n`;
      prompt += `Deliver detailed negative test scenarios for:\n`;
      prompt += `1. **Network Degradation**: High latency (3000ms delay), packet loss (20%), offline browser transition mid-form.\n`;
      prompt += `2. **Malformed Payload Injection**: Corrupted JSON bodies, truncated multipart uploads, expired auth headers.\n`;
      prompt += `3. **Downstream Service Outages**: Third-party payment gateway timeout or 503 response; verify graceful fallback state.\n`;
      break;

    case "compliance_audit":
      prompt += `### 1. COMPLIANCE & AUDIT ASSURANCE OBJECTIVE\n`;
      prompt += `Generate formal quality assurance evidence documentation satisfying SOC 2 Type II, ISO 27001, and GDPR/HIPAA standards.\n\n`;
      prompt += `### 2. CONTEXT\n`;
      prompt += `Active System Requirements:\n${reqText}\n\n`;
      prompt += `### 3. DELIVERABLES\n`;
      prompt += `1. **Audit Traceability Matrix**: Mapping regulatory controls to verified automated test cases and scan logs.\n`;
      prompt += `2. **Data Privacy Checks**: PII masking in telemetry logs, cookie consent enforcement, data deletion verification.\n`;
      prompt += `3. **Change Management Sign-Off**: Formal QA release approval statement with verified defect metrics.\n`;
      break;

    default:
      prompt += `### 1. REGRESSION SUITE ARCHITECTURE OBJECTIVE\n`;
      prompt += `Architect an automated regression testing hierarchy for ${targetUrl} balancing coverage, speed, and reliability.\n\n`;
      prompt += `### 2. WORKFLOW & FEATURE SCOPE\n`;
      prompt += `Discovered Major Features:\n${featuresText}\n\n`;
      prompt += `### 3. TEST PYRAMID STRATEGY\n`;
      prompt += `1. **Smoke Suite (P0 - Run on every PR, < 3 mins)**: Critical happy path and authentication smoke tests.\n`;
      prompt += `2. **Sanity Suite (P1 - Run post-deployment, < 10 mins)**: High-priority core workflows and integrations.\n`;
      prompt += `3. **Full Regression Suite (P2/P3 - Nightly cron)**: Complete matrix of edge cases, accessibility, and negative scenarios.\n`;
      break;
  }

  prompt += `\n### 4. RIGOROUS ANTI-FABRICATION & QUALITY RULES\n`;
  prompt += `- Never assume unverified endpoints or secrets exist. Base all test logic on real web patterns.\n`;
  prompt += `- Ensure all selectors are resilient and follow Playwright / testing library best practices.\n`;
  prompt += `- Format all output in clean GitHub-flavored markdown with copyable code blocks.\n`;

  return prompt;
}
