import {
  SystemRequirement,
  RequirementCategory,
  RequirementPriority,
  RequirementStatus,
} from "@/types/requirements";
import { TenSectionAnalysis, VerificationStatus } from "@/types/website-analysis";
import { ProjectOption } from "@/lib/projects/projectState";

/**
 * Generate Gherkin acceptance criteria for a given requirement context.
 */
export function generateAcceptanceCriteriaForRequirement(
  title: string,
  category: RequirementCategory,
  description?: string
): string[] {
  const cleanTitle = title.toLowerCase();

  if (category === "Security" || cleanTitle.includes("auth") || cleanTitle.includes("token")) {
    return [
      `Given an unauthenticated or expired session token, When attempting to access "${title}", Then the system must deny access with HTTP 401 Unauthorized and redirect to login.`,
      `Given an authorized user session, When performing the action, Then the transaction must be signed with a cryptographically secure nonce to prevent replay attacks.`,
      `Given any payload submitted to this endpoint, When malicious script or SQL injection patterns are detected, Then the payload must be sanitized and an audit security event logged.`,
      `Given rate limit thresholds (maximum 10 requests per second per IP), When the limit is exceeded, Then HTTP 429 Too Many Requests must be returned with Retry-After header.`,
    ];
  }

  if (category === "Business Rules" || cleanTitle.includes("payment") || cleanTitle.includes("order") || cleanTitle.includes("price")) {
    return [
      `Given an order ready for processing, When checkout is initiated, Then inventory must be atomically reserved for 10 minutes to prevent overselling.`,
      `Given currency or tax calculation parameters, When customer changes shipping destination, Then taxes and shipping rates must recalculate immediately with zero discrepancy.`,
      `Given a payment transaction failure from the payment gateway, When the error response is received, Then reserved stock must be released and user notified with actionable error steps.`,
      `Given a successful transaction confirmation, When status transitions to Paid, Then an immutable invoice record and customer email notification must be generated.`,
    ];
  }

  if (category === "Non-Functional" || cleanTitle.includes("performance") || cleanTitle.includes("latency")) {
    return [
      `Given normal production traffic load (up to 5,000 concurrent users), When any user requests this view, Then p95 server response time must remain under 350ms.`,
      `Given mobile network conditions (3G / 4G throttle), When the initial payload loads, Then Cumulative Layout Shift (CLS) must remain below 0.1 and LCP under 2.5s.`,
      `Given a temporary database replica outage, When read queries fail on replica, Then the query router must transparently fall back to primary without dropping user sessions.`,
    ];
  }

  // Functional / User Requirements
  return [
    `Given a qualified user navigates to the feature interface, When they submit valid input data for "${title}", Then the system must process the request and display a positive confirmation state in under 500ms.`,
    `Given required fields are missing or improperly formatted, When the user attempts submission, Then real-time inline validation errors must highlight invalid fields without page reload.`,
    `Given the user navigates across devices or refreshes the page, When they return to the workflow, Then drafts or incomplete session state must be restored reliably.`,
    `Given any state mutation completes successfully, When observing system telemetry, Then an audit trail entry must be recorded in the persistent event log.`,
  ];
}

/**
 * Generate structured, traceable requirements from a TenSectionAnalysis or project metadata.
 */
export function generateRequirementsFromAnalysis(
  analysis: TenSectionAnalysis | null | undefined,
  project: ProjectOption,
  existingCount: number = 0
): SystemRequirement[] {
  const generated: SystemRequirement[] = [];
  let seq = existingCount + 1;

  const urlDomain = project.domain || "app.domain.com";
  const projectName = project.name;

  // 1. Extract from Major Features in Section 4
  const majorFeatures = analysis?.section4_featuresAndWorkflows?.majorFeatures;
  if (majorFeatures && Array.isArray(majorFeatures) && majorFeatures.length > 0) {
    majorFeatures.forEach((feat) => {
      const isSecurity =
        feat.featureName.toLowerCase().includes("auth") ||
        feat.featureName.toLowerCase().includes("security") ||
        feat.featureName.toLowerCase().includes("login");
      const category: RequirementCategory = isSecurity ? "Security" : "Functional";
      const priority: RequirementPriority = isSecurity ? "Critical" : "High";
      const reqCode = `REQ-${category === "Security" ? "SEC" : "FUNC"}-${String(seq++).padStart(3, "0")}`;

      generated.push({
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode,
        title: feat.featureName,
        description: feat.businessPurpose
          ? `${feat.businessPurpose}. Customer Benefit: ${feat.customerBenefit || "Streamlined operational experience."}`
          : `System must provide fully verified ${feat.featureName} capability with reliable error handling and automated validation.`,
        category,
        status: "AI Generated",
        priority,
        verificationStatus: (feat.verificationStatus as VerificationStatus) || "Verified",
        acceptanceCriteria: generateAcceptanceCriteriaForRequirement(feat.featureName, category),
        traceability: {
          sourceFeature: feat.featureName,
          businessFlow: feat.businessPurpose || `${projectName} Core Workflow`,
          testCasesCount: 2,
          defectsCount: 0,
          sourceUrl: `https://${urlDomain}`,
        },
      });
    });
  }

  // 2. Extract from Workflow Journey Steps in Section 4
  const steps = analysis?.section4_featuresAndWorkflows?.workflowJourney?.steps;
  if (steps && Array.isArray(steps) && steps.length > 0) {
    steps.forEach((step) => {
      const reqCode = `REQ-BIZ-${String(seq++).padStart(3, "0")}`;
      const failPoints = step.failurePoints && step.failurePoints.length > 0
        ? ` Must guard against failure modes: ${step.failurePoints.join("; ")}.`
        : "";

      generated.push({
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode,
        title: `Business Flow: ${step.stageName}`,
        description: `When user performs "${step.userAction}", the system must execute: "${step.systemResponse}".${failPoints}`,
        category: "Business Rules",
        status: "AI Generated",
        priority: "High",
        verificationStatus: "Verified",
        acceptanceCriteria: [
          `Given the user is at step ${step.stepNumber} (${step.stageName}), When they execute "${step.userAction}", Then the system must immediately trigger "${step.systemResponse}".`,
          `Given network delay or transient server failure at this stage, When retrying the operation, Then idempotency tokens must ensure duplicate side-effects are prevented.`,
          `Given invalid input at this workflow stage, When validation fails, Then the user must receive clear actionable correction hints without losing previously entered form data.`,
        ],
        traceability: {
          sourceFeature: step.stageName,
          businessFlow: `Stage ${step.stepNumber}: ${step.stageName}`,
          testCasesCount: 1,
          defectsCount: 0,
          sourceUrl: `https://${urlDomain}`,
        },
      });
    });
  }

  // 3. Extract Security / Operational Risks from Section 9
  const opRisks = analysis?.section9_businessRisksAndLimitations?.operationalRisks;
  if (opRisks && Array.isArray(opRisks) && opRisks.length > 0) {
    opRisks.slice(0, 2).forEach((risk) => {
      const reqCode = `REQ-SEC-${String(seq++).padStart(3, "0")}`;
      generated.push({
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode,
        title: `Security & Risk Mitigation: ${risk.risk}`,
        description: `Operational impact: ${risk.impact}. Mitigation requirement: ${risk.mitigationStrategy}.`,
        category: "Security",
        status: "AI Generated",
        priority: risk.severity === "High" ? "Critical" : "High",
        verificationStatus: "Verified",
        acceptanceCriteria: generateAcceptanceCriteriaForRequirement(risk.risk, "Security"),
        traceability: {
          sourceFeature: "Risk Mitigation Engine",
          businessFlow: "Audit & Operational Controls",
          testCasesCount: 2,
          defectsCount: 0,
          sourceUrl: `https://${urlDomain}`,
        },
      });
    });
  }

  // 4. Extract Performance / Non-Functional from Section 8
  const uiFriction = analysis?.section8_uiUxAndExperience?.frictionPoints;
  if (uiFriction && Array.isArray(uiFriction) && uiFriction.length > 0) {
    const reqCode = `REQ-NFR-${String(seq++).padStart(3, "0")}`;
    generated.push({
      id: `gen_${Date.now()}_${seq}`,
      projectId: project.id,
      reqCode,
      title: "UI Performance & Responsive Layout Stability",
      description: `Eliminate identified UI friction points: ${uiFriction.slice(0, 2).join("; ")}. Enforce sub-second rendering and WCAG 2.1 accessibility compliance.`,
      category: "Non-Functional",
      status: "AI Generated",
      priority: "Medium",
      verificationStatus: "Verified",
      acceptanceCriteria: generateAcceptanceCriteriaForRequirement("UI Performance & Stability", "Non-Functional"),
      traceability: {
        sourceFeature: "Client-Side Rendering Engine",
        businessFlow: "End-User Interface Experience",
        testCasesCount: 1,
        defectsCount: 0,
        sourceUrl: `https://${urlDomain}`,
      },
    });
  }

  // If no items were extracted (e.g. analysis has not been run or empty), produce tailored domain requirements
  if (generated.length === 0) {
    return generateDomainTailoredRequirements(project, existingCount);
  }

  return generated;
}

/**
 * Fallback generator that produces realistic, domain-tailored requirements
 * based on the active project's domain and business type.
 */
export function generateDomainTailoredRequirements(
  project: ProjectOption,
  existingCount: number = 0
): SystemRequirement[] {
  let seq = existingCount + 1;
  const domain = project.domain.toLowerCase();
  const name = project.name;

  if (domain.includes("daraz") || domain.includes("shop") || domain.includes("luxwear") || domain.includes("store")) {
    // E-commerce Marketplace Requirements
    return [
      {
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode: `REQ-FUNC-${String(seq++).padStart(3, "0")}`,
        title: "Product Catalog Search & Faceted Filtering",
        description: "Shoppers must be able to search products with instantaneous autocomplete, fuzzy spelling correction, and facet filters by price, brand, rating, and seller rating.",
        category: "Functional",
        status: "AI Generated",
        priority: "Critical",
        verificationStatus: "Verified",
        acceptanceCriteria: [
          "Given a query with typographical errors (e.g., 'samung' instead of 'samsung'), When search is executed, Then the engine returns corrected matching products with a 'Showing results for Samsung' notice.",
          "Given multiple facet filters selected (Price Range: $50-$100, Rating: >= 4 stars), When filters are applied, Then catalog refreshes asynchronously in < 250ms without full page reload.",
          "Given an out-of-stock product, When browsing the catalog, Then an 'Out of Stock' badge is visible and Add-to-Cart is disabled.",
        ],
        traceability: {
          sourceFeature: "Catalog & Search Service",
          businessFlow: "Product Discovery Journey",
          testCasesCount: 4,
          defectsCount: 0,
          sourceUrl: `https://${project.domain}/search`,
        },
      },
      {
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode: `REQ-BIZ-${String(seq++).padStart(3, "0")}`,
        title: "Cart Inventory Reservation & Price Lock",
        description: "Items placed in the checkout queue must lock physical inventory for 15 minutes to guarantee availability while the customer completes payment.",
        category: "Business Rules",
        status: "AI Generated",
        priority: "High",
        verificationStatus: "Verified",
        acceptanceCriteria: [
          "Given a customer enters checkout, When clicking 'Proceed to Payment', Then available stock counter is decremented by order quantity for a 15-minute reservation TTL.",
          "Given a checkout session exceeds 15 minutes without payment completion, When timer expires, Then reservation is released back to active catalog automatically.",
          "Given a flash sale price change occurring during checkout, When the customer started checkout before the price change, Then the locked initial price is honored.",
        ],
        traceability: {
          sourceFeature: "Inventory Reservation Broker",
          businessFlow: "Checkout & Cart Finalization",
          testCasesCount: 3,
          defectsCount: 0,
          sourceUrl: `https://${project.domain}/cart`,
        },
      },
      {
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode: `REQ-SEC-${String(seq++).padStart(3, "0")}`,
        title: "PCI-DSS Compliant Payment Gateway Tokenization",
        description: "Payment credentials, CVV codes, and billing information must never touch application memory unencrypted and must utilize Stripe / bKash / SSLCommerz tokenized fields.",
        category: "Security",
        status: "Approved",
        priority: "Critical",
        verificationStatus: "Verified",
        acceptanceCriteria: [
          "Given a credit card or mobile wallet payment method, When customer inputs payment data, Then inputs must render inside isolated PCI-DSS compliant iframes hosted by gateway.",
          "Given payment submission, When token is generated, Then only single-use payment token and last-4 digits are transmitted to application backend.",
          "Given TLS communication, When verifying transport protocol, Then TLS 1.3 is strictly enforced with HSTS enabled and zero insecure ciphers permitted.",
        ],
        traceability: {
          sourceFeature: "Payment Gateway Connector",
          businessFlow: "Secure Payment Execution",
          testCasesCount: 5,
          defectsCount: 0,
          sourceUrl: `https://${project.domain}/checkout/payment`,
        },
      },
      {
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode: `REQ-USR-${String(seq++).padStart(3, "0")}`,
        title: "Guest Checkout with One-Click Account Provisioning",
        description: "Allow first-time buyers to complete purchase using only phone number/email without requiring upfront password creation.",
        category: "User Requirements",
        status: "Reviewed",
        priority: "Medium",
        verificationStatus: "Verified",
        acceptanceCriteria: [
          "Given an unauthenticated visitor with items in cart, When selecting Guest Checkout, Then they can supply shipping address and phone number without password.",
          "Given order completion, When order confirmation renders, Then an option to 'Create Account with 1-Click' auto-links order history to the new account.",
        ],
        traceability: {
          sourceFeature: "Checkout Flow",
          businessFlow: "First-Time Shopper Acquisition",
          testCasesCount: 2,
          defectsCount: 0,
          sourceUrl: `https://${project.domain}/checkout`,
        },
      },
      {
        id: `gen_${Date.now()}_${seq}`,
        projectId: project.id,
        reqCode: `REQ-NFR-${String(seq++).padStart(3, "0")}`,
        title: "Mobile Viewport Web Vitals Optimization",
        description: "Ensure mobile page load achieves Core Web Vitals targets: LCP < 2.2s, FID < 100ms, and zero layout shift on 3G cellular emulation.",
        category: "Non-Functional",
        status: "Draft",
        priority: "High",
        verificationStatus: "Verified",
        acceptanceCriteria: [
          "Given standard 4G mobile emulation in Chrome DevTools, When loading any catalog page, Then Largest Contentful Paint must measure under 2.2 seconds.",
          "Given dynamic banner loading, When promotional graphics render, Then explicit aspect-ratio and width/height attributes prevent layout shifts (CLS < 0.05).",
        ],
        traceability: {
          sourceFeature: "Asset Optimization Pipeline",
          businessFlow: "Mobile Shopper Browsing",
          testCasesCount: 2,
          defectsCount: 0,
          sourceUrl: `https://${project.domain}/`,
        },
      },
    ];
  }

  // Default SaaS / FinTech CRM Requirements (OpsROI or FinTech Portal)
  return [
    {
      id: `gen_${Date.now()}_${seq}`,
      projectId: project.id,
      reqCode: `REQ-FUNC-${String(seq++).padStart(3, "0")}`,
      title: "Multi-Tenant Workspace & Role-Based Access Control",
      description: "Organization administrators must be able to manage team members across Owner, Admin, QA Engineer, and Viewer roles with granular permission policies.",
      category: "Functional",
      status: "Approved",
      priority: "Critical",
      verificationStatus: "Verified",
      acceptanceCriteria: [
        "Given an Organization Owner, When inviting a new user with 'QA Engineer' role, Then the invited user receives an invite token with 48-hour expiration.",
        "Given a user with 'Viewer' role, When attempting to edit project configurations or delete test suites, Then write action buttons must be disabled and API returns 403 Forbidden.",
        "Given multi-tenant database isolation, When querying project resources, Then row-level security (RLS) policies prevent data leakage between different organization IDs.",
      ],
      traceability: {
        sourceFeature: "Organization & RBAC Engine",
        businessFlow: "Team Onboarding & Access Control",
        testCasesCount: 4,
        defectsCount: 0,
        sourceUrl: `https://${project.domain}/settings/team`,
      },
    },
    {
      id: `gen_${Date.now()}_${seq}`,
      projectId: project.id,
      reqCode: `REQ-BIZ-${String(seq++).padStart(3, "0")}`,
      title: "Automated Daily QA Regression Run Scheduling",
      description: "System must trigger automated Playwright test execution according to configured cron schedules and broadcast failure alerts via Slack/Email webhooks.",
      category: "Business Rules",
      status: "AI Generated",
      priority: "High",
      verificationStatus: "Verified",
      acceptanceCriteria: [
        "Given a cron schedule of '0 2 * * *' (2:00 AM UTC), When system time matches, Then the execution worker launches the test suite in headless mode.",
        "Given test suite completion with >= 1 failed test case, When status is finalized, Then a rich defect payload is posted to configured webhook endpoints within 15 seconds.",
        "Given zero test failures, When status is finalized, Then pass rate metrics in Executive Dashboard refresh automatically.",
      ],
      traceability: {
        sourceFeature: "Cron Runner & Webhook Notifier",
        businessFlow: "Continuous Quality Assurance Pipeline",
        testCasesCount: 3,
        defectsCount: 0,
        sourceUrl: `https://${project.domain}/automation/schedules`,
      },
    },
    {
      id: `gen_${Date.now()}_${seq}`,
      projectId: project.id,
      reqCode: `REQ-SEC-${String(seq++).padStart(3, "0")}`,
      title: "OAuth 2.0 PKCE & 15-Minute Magic Link Expiration",
      description: "Authentication service must support passwordless email magic link and Google/GitHub OAuth with PKCE verification and 15-minute single-use token lifecycle.",
      category: "Security",
      status: "Approved",
      priority: "Critical",
      verificationStatus: "Verified",
      acceptanceCriteria: [
        "Given a magic link request, When generated by authentication service, Then token must be a cryptographically secure 256-bit hash with strict 15-minute TTL.",
        "Given a magic link clicked twice (replay attempt), When validated on second click, Then token is rejected as already consumed with descriptive error.",
        "Given 3 consecutive failed authentication requests from a single IP, When the 4th attempt is made within 5 minutes, Then rate limiting imposes a 15-minute cool-down.",
      ],
      traceability: {
        sourceFeature: "Auth0 / Supabase Auth Microservice",
        businessFlow: "User Authentication & Session Management",
        testCasesCount: 5,
        defectsCount: 0,
        sourceUrl: `https://${project.domain}/auth/login`,
      },
    },
    {
      id: `gen_${Date.now()}_${seq}`,
      projectId: project.id,
      reqCode: `REQ-USR-${String(seq++).padStart(3, "0")}`,
      title: "Interactive Test Run Live Log Streaming",
      description: "QA engineers inspecting active test executions must view real-time WebSocket console logs, network payloads, and live screenshots without browser refresh.",
      category: "User Requirements",
      status: "Reviewed",
      priority: "Medium",
      verificationStatus: "Verified",
      acceptanceCriteria: [
        "Given a running Playwright execution session, When opening the Live Inspector tab, Then WSS connection connects in < 500ms and streams stdout/stderr lines with auto-scroll.",
        "Given the user pauses auto-scroll to inspect a previous log line, When new logs arrive, Then viewport position is preserved until user clicks 'Resume Auto-Scroll'.",
      ],
      traceability: {
        sourceFeature: "Live Log Streaming Gateway",
        businessFlow: "Interactive QA Debugging",
        testCasesCount: 2,
        defectsCount: 0,
        sourceUrl: `https://${project.domain}/runs/live`,
      },
    },
    {
      id: `gen_${Date.now()}_${seq}`,
      projectId: project.id,
      reqCode: `REQ-NFR-${String(seq++).padStart(3, "0")}`,
      title: "Sub-400ms Query Latency for Test Analytics API",
      description: "Executive quality dashboard aggregated pass/fail statistics, trend charts, and defect distribution queries must resolve in under 400ms under 500 QPS load.",
      category: "Non-Functional",
      status: "Draft",
      priority: "High",
      verificationStatus: "Verified",
      acceptanceCriteria: [
        "Given 1,000,000 historical test execution records in the database, When calling /api/analytics/quality-trends, Then optimized indexing and Redis caching ensure p95 response time < 400ms.",
        "Given database maintenance window or cache miss storm, When queries execute against PostgreSQL directly, Then materialized views serve read traffic safely.",
      ],
      traceability: {
        sourceFeature: "Analytics Aggregation Engine",
        businessFlow: "Executive Reporting & KPI Monitoring",
        testCasesCount: 2,
        defectsCount: 0,
        sourceUrl: `https://${project.domain}/analytics`,
      },
    },
  ];
}

/**
 * Format requirements for Markdown export (formal SRS document).
 */
export function formatRequirementsAsMarkdown(
  requirements: SystemRequirement[],
  projectName: string,
  domain: string
): string {
  const dateStr = new Date().toISOString().split("T")[0];
  let md = `# Software Requirements Specification (SRS) & Traceability Matrix\n\n`;
  md += `**Project:** ${projectName} (${domain})\n`;
  md += `**Author:** Shawon Ahmed (QA Agent Hub Autonomous Engine)\n`;
  md += `**Generated:** ${dateStr}\n`;
  md += `**Total Requirements:** ${requirements.length}\n\n`;

  md += `## 1. Traceability Matrix Summary\n\n`;
  md += `| Req ID | Category | Title | Priority | Status | Verification | Linked Tests | Defects |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |\n`;
  requirements.forEach((req) => {
    md += `| **${req.reqCode}** | ${req.category} | ${req.title} | ${req.priority} | ${req.status} | ${req.verificationStatus} | ${req.traceability.testCasesCount} | ${req.traceability.defectsCount} |\n`;
  });

  md += `\n---\n\n## 2. Exhaustive Requirements Specification\n\n`;

  requirements.forEach((req, idx) => {
    md += `### ${idx + 1}. [${req.reqCode}] ${req.title}\n\n`;
    md += `- **Category:** ${req.category}\n`;
    md += `- **Priority:** ${req.priority}\n`;
    md += `- **Status:** ${req.status}\n`;
    md += `- **Verification Status:** ${req.verificationStatus}\n`;
    md += `- **Source Feature:** ${req.traceability.sourceFeature}\n`;
    md += `- **Business Flow:** ${req.traceability.businessFlow}\n`;
    if (req.traceability.sourceUrl) {
      md += `- **Source URL:** ${req.traceability.sourceUrl}\n`;
    }
    md += `\n**Description:**\n${req.description}\n\n`;
    md += `**Acceptance Criteria:**\n`;
    if (req.acceptanceCriteria && req.acceptanceCriteria.length > 0) {
      req.acceptanceCriteria.forEach((ac, acIdx) => {
        md += `${acIdx + 1}. ${ac}\n`;
      });
    } else {
      md += `*No acceptance criteria specified.*\n`;
    }
    md += `\n---\n\n`;
  });

  return md;
}

/**
 * Format requirements for CSV export.
 */
export function formatRequirementsAsCsv(requirements: SystemRequirement[]): string {
  const headers = [
    "Requirement ID",
    "Category",
    "Title",
    "Description",
    "Priority",
    "Status",
    "Verification Status",
    "Acceptance Criteria",
    "Source Feature",
    "Business Flow",
    "Test Cases Count",
    "Defects Count",
    "Source URL",
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = requirements.map((req) => [
    escapeCsv(req.reqCode),
    escapeCsv(req.category),
    escapeCsv(req.title),
    escapeCsv(req.description),
    escapeCsv(req.priority),
    escapeCsv(req.status),
    escapeCsv(req.verificationStatus),
    escapeCsv(req.acceptanceCriteria.join("\n")),
    escapeCsv(req.traceability.sourceFeature),
    escapeCsv(req.traceability.businessFlow),
    req.traceability.testCasesCount,
    req.traceability.defectsCount,
    escapeCsv(req.traceability.sourceUrl || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
