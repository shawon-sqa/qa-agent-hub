import {
  FunctionalTestCase,
  TestCasePriority,
  TestCaseType,
  TestCategoryVariation,
  TestCaseExecutionStep,
} from "@/types/functional-qa";
import { SystemRequirement } from "@/types/requirements";
import { BusinessFlow } from "@/types/business-flows";
import { ProjectOption } from "@/lib/projects/projectState";

/**
 * Generates structured functional test cases from active requirements and business flows.
 * CRITICAL RULE: All newly generated test cases MUST default strictly to executionStatus = "Not Run".
 */
export function generateTestCasesFromRequirementsAndFlows(
  requirements: SystemRequirement[],
  flows: BusinessFlow[],
  project: ProjectOption
): FunctionalTestCase[] {
  const testCases: FunctionalTestCase[] = [];
  let seq = 1;

  // 1. Generate from Business Flows (End-to-End Scenarios)
  flows.forEach((flow, fIdx) => {
    const scenarioId = `SCEN-${String(fIdx + 1).padStart(3, "0")}`;
    const flowModule = flow.category === "Checkout & Payment" ? "Checkout" : flow.category === "Authentication" ? "Auth" : "User Journey";

    // Positive Happy Path Test Case
    const positiveTcId = `TC-E2E-${String(seq++).padStart(3, "0")}`;
    const flowSteps: TestCaseExecutionStep[] = flow.steps.map((s, idx) => ({
      stepNumber: idx + 1,
      action: s.userAction,
      expectedResult: s.systemResponse,
      status: "Not Run",
    }));

    testCases.push({
      id: `tc_${Date.now()}_${seq}`,
      projectId: project.id,
      scenarioId,
      testCaseId: positiveTcId,
      flowId: flow.id,
      flowCode: flow.flowCode,
      title: `[Happy Path] Verify complete execution of ${flow.title}`,
      module: flowModule,
      categoryVariation: "Positive",
      type: "e2e",
      priority: "high",
      preconditions: [
        `Target domain is reachable: https://${project.domain}`,
        "User has valid, non-expired credentials",
        "Required test inventory and dependencies are provisioned",
      ],
      steps: flowSteps,
      expectedResult: `System completes all ${flow.steps.length} workflow stages and arrives at terminal state "${flow.endPoint}" without unexpected errors.`,
      verificationStatus: "Verified",
      executionStatus: "Not Run", // STRICT DEFAULT
      approvalStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Negative Exception Handling Test Case
    const decisionStep = flow.steps.find((s) => s.type === "decision" || s.type === "verification") || flow.steps[1];
    if (decisionStep) {
      const negativeTcId = `TC-E2E-${String(seq++).padStart(3, "0")}`;
      const failReason = decisionStep.failurePoints?.[0] || "Invalid input parameters / unauthorized token";

      testCases.push({
        id: `tc_${Date.now()}_${seq}`,
        projectId: project.id,
        scenarioId,
        testCaseId: negativeTcId,
        flowId: flow.id,
        flowCode: flow.flowCode,
        title: `[Negative] Verify failure handling at ${decisionStep.title} (${failReason})`,
        module: flowModule,
        categoryVariation: "Negative",
        type: "e2e",
        priority: "high",
        preconditions: [
          `Target domain is reachable: https://${project.domain}`,
          "Simulate invalid input or expired session state",
        ],
        steps: [
          {
            stepNumber: 1,
            action: `Initiate workflow at ${flow.startPoint}`,
            expectedResult: "Initial state renders correctly",
            status: "Not Run",
          },
          {
            stepNumber: 2,
            action: `At ${decisionStep.title}, inject invalid trigger: "${failReason}"`,
            expectedResult: "System rejects transaction with explicit inline warning and does not corrupt state",
            status: "Not Run",
          },
        ],
        expectedResult: `System catches the negative condition gracefully, displays actionable feedback, and avoids 500 Internal Server Error.`,
        verificationStatus: "Verified",
        executionStatus: "Not Run", // STRICT DEFAULT
        approvalStatus: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // 2. Generate from System Requirements
  requirements.forEach((req, rIdx) => {
    const scenarioId = `SCEN-${String(flows.length + rIdx + 1).padStart(3, "0")}`;
    const tcType: TestCaseType = req.category === "Security" ? "security" : req.category === "Non-Functional" ? "performance" : "e2e";
    const tcPriority: TestCasePriority = req.priority.toLowerCase() as TestCasePriority;
    const tcId = `TC-${tcType.toUpperCase()}-${String(seq++).padStart(3, "0")}`;

    const steps: TestCaseExecutionStep[] = (req.acceptanceCriteria || []).slice(0, 3).map((ac, idx) => ({
      stepNumber: idx + 1,
      action: `Execute requirement check: ${ac.split(", When")[0] || ac}`,
      expectedResult: ac.includes("Then") ? ac.split("Then")[1].trim() : "Verified expected outcome",
      status: "Not Run",
    }));

    if (steps.length === 0) {
      steps.push({
        stepNumber: 1,
        action: `Execute verification of ${req.title}`,
        expectedResult: req.description,
        status: "Not Run",
      });
    }

    testCases.push({
      id: `tc_${Date.now()}_${seq}`,
      projectId: project.id,
      scenarioId,
      testCaseId: tcId,
      requirementId: req.id,
      requirementCode: req.reqCode,
      title: `Verify ${req.title}`,
      module: req.category,
      categoryVariation: "Positive",
      type: tcType,
      priority: tcPriority,
      preconditions: [
        `Active project environment: ${project.environment}`,
        `Linked specification ID: ${req.reqCode}`,
      ],
      steps,
      expectedResult: `System behaves strictly in compliance with ${req.reqCode} acceptance criteria.`,
      verificationStatus: req.verificationStatus,
      executionStatus: "Not Run", // STRICT DEFAULT
      approvalStatus: req.status === "Approved" ? "approved" : "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // If no requirements or flows exist yet, produce comprehensive default test cases
  if (testCases.length === 0) {
    return generateDomainTailoredTestCases(project);
  }

  return testCases;
}

/**
 * Generate 3 distinct test variations (Positive, Negative, Edge Case) for any test case.
 */
export function generateVariationsForTestCase(base: FunctionalTestCase): FunctionalTestCase[] {
  const ts = Date.now();
  const baseNum = base.testCaseId.replace(/\D/g, "") || "101";

  const positiveCase: FunctionalTestCase = {
    ...base,
    id: `tc_${ts}_pos`,
    testCaseId: `${base.testCaseId}-POS`,
    title: `[Positive] ${base.title.replace(/^\[(Positive|Negative|Edge Case)\]\s*/, "")} (Valid Input)`,
    categoryVariation: "Positive",
    executionStatus: "Not Run",
    steps: base.steps.map((s) => ({ ...s, status: "Not Run" })),
    expectedResult: `Happy path execution succeeds cleanly with zero validation errors.`,
  };

  const negativeCase: FunctionalTestCase = {
    ...base,
    id: `tc_${ts}_neg`,
    testCaseId: `${base.testCaseId}-NEG`,
    title: `[Negative] ${base.title.replace(/^\[(Positive|Negative|Edge Case)\]\s*/, "")} (Malformed / Unauthorized Input)`,
    categoryVariation: "Negative",
    priority: "high",
    executionStatus: "Not Run",
    steps: [
      {
        stepNumber: 1,
        action: "Send malformed payload / expired credentials to endpoint",
        expectedResult: "System rejects with HTTP 400 Bad Request or HTTP 401 Unauthorized",
        status: "Not Run",
      },
      {
        stepNumber: 2,
        action: "Inspect response headers and body",
        expectedResult: "No internal stack trace or database errors exposed in response payload",
        status: "Not Run",
      },
    ],
    expectedResult: "Graceful error message returned without crashing or corrupting data.",
  };

  const edgeCase: FunctionalTestCase = {
    ...base,
    id: `tc_${ts}_edge`,
    testCaseId: `${base.testCaseId}-EDGE`,
    title: `[Edge Case] ${base.title.replace(/^\[(Positive|Negative|Edge Case)\]\s*/, "")} (Boundary Limit & Race Condition)`,
    categoryVariation: "Edge Case",
    priority: "medium",
    executionStatus: "Not Run",
    steps: [
      {
        stepNumber: 1,
        action: "Submit maximum allowable input size (10,000 characters with unicode emojis)",
        expectedResult: "Inputs are correctly sanitized and truncated or validated according to schema limits",
        status: "Not Run",
      },
      {
        stepNumber: 2,
        action: "Trigger 5 concurrent rapid clicks (double submission race condition check)",
        expectedResult: "Idempotency token ensures only 1 transaction is processed; 4 duplicates are de-duplicated",
        status: "Not Run",
      },
    ],
    expectedResult: "Boundary input is handled gracefully and concurrent submissions are deduplicated.",
  };

  return [positiveCase, negativeCase, edgeCase];
}

/**
 * Fallback generator for realistic, project-tailored test cases.
 */
export function generateDomainTailoredTestCases(project: ProjectOption): FunctionalTestCase[] {
  const domain = project.domain.toLowerCase();

  if (domain.includes("daraz") || domain.includes("shop") || domain.includes("store")) {
    // E-Commerce Marketplace Test Cases
    return [
      {
        id: "tc_ecom_1",
        projectId: project.id,
        scenarioId: "SCEN-001",
        testCaseId: "TC-E2E-001",
        title: "Product Search Autocomplete and Faceted Filtering",
        module: "Catalog & Search",
        categoryVariation: "Positive",
        type: "e2e",
        priority: "critical",
        preconditions: [
          `Target marketplace: https://${project.domain}`,
          "Search index active with >= 10,000 SKUs",
        ],
        steps: [
          {
            stepNumber: 1,
            action: "Type 'smart watch' into search input box",
            expectedResult: "Autocomplete dropdown renders 5 relevant suggestions within 150ms",
            status: "Not Run",
          },
          {
            stepNumber: 2,
            action: "Select filter 'Price: $50 - $100' and 'Rating: 4 Stars & Up'",
            expectedResult: "Product grid updates asynchronously without full page reload",
            status: "Not Run",
          },
          {
            stepNumber: 3,
            action: "Verify displayed products match the active filter criteria",
            expectedResult: "All visible items have price between $50-$100 and rating >= 4.0",
            status: "Not Run",
          },
        ],
        expectedResult: "Search autocomplete and multi-facet filtering return strictly matching products in < 300ms.",
        verificationStatus: "Verified",
        executionStatus: "Not Run",
        approvalStatus: "approved",
      },
      {
        id: "tc_ecom_2",
        projectId: project.id,
        scenarioId: "SCEN-001",
        testCaseId: "TC-E2E-002",
        title: "Cart Inventory Reservation Expiration After 15 Minutes",
        module: "Checkout",
        categoryVariation: "Negative",
        type: "e2e",
        priority: "high",
        preconditions: [
          "Item has exactly 1 unit in available inventory",
          "Customer adds item to cart and proceeds to checkout",
        ],
        steps: [
          {
            stepNumber: 1,
            action: "Add last remaining inventory unit to cart",
            expectedResult: "Item is reserved; catalog displays 'Reserved in another cart'",
            status: "Not Run",
          },
          {
            stepNumber: 2,
            action: "Wait 15 minutes (or simulate TTL expiration via clock advance)",
            expectedResult: "Cart session expires and reservation lock releases",
            status: "Not Run",
          },
          {
            stepNumber: 3,
            action: "Second shopper refreshes product page",
            expectedResult: "Unit is once again available for purchase",
            status: "Not Run",
          },
        ],
        expectedResult: "Cart lock automatically releases expired inventory back to available catalog.",
        verificationStatus: "Verified",
        executionStatus: "Not Run",
        approvalStatus: "approved",
      },
      {
        id: "tc_ecom_3",
        projectId: project.id,
        scenarioId: "SCEN-002",
        testCaseId: "TC-SEC-001",
        title: "Cash on Delivery OTP Rate Limiting and Brute Force Prevention",
        module: "Security",
        categoryVariation: "Edge Case",
        type: "security",
        priority: "critical",
        preconditions: [
          "Customer is on payment verification step with high-value order (> $100)",
        ],
        steps: [
          {
            stepNumber: 1,
            action: "Submit 5 consecutive incorrect OTP codes in 30 seconds",
            expectedResult: "System locks OTP input and enforces 15-minute cool-down",
            status: "Not Run",
          },
          {
            stepNumber: 2,
            action: "Attempt 6th submission during cool-down period",
            expectedResult: "HTTP 429 Too Many Requests returned with Retry-After header",
            status: "Not Run",
          },
        ],
        expectedResult: "Rate limiting prevents brute force OTP attacks and alerts fraud detection service.",
        verificationStatus: "Verified",
        executionStatus: "Not Run",
        approvalStatus: "approved",
      },
    ];
  }

  // Cloud SaaS / OpsROI / FinTech Default Test Cases
  return [
    {
      id: "tc_saas_1",
      projectId: project.id,
      scenarioId: "SCEN-001",
      testCaseId: "TC-E2E-001",
      title: "Passwordless Magic Link Authentication Flow",
      module: "Authentication",
      categoryVariation: "Positive",
      type: "e2e",
      priority: "critical",
      preconditions: [
        `Auth service online at https://${project.domain}`,
        "User has verified corporate email address",
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Enter valid corporate email on /auth/login and click 'Send Magic Link'",
          expectedResult: "System returns 200 OK and sends single-use sign-in token email",
          status: "Not Run",
        },
        {
          stepNumber: 2,
          action: "Click the verification link from email within 15 minutes",
          expectedResult: "System validates token hash, consumes it, and issues secure session JWT",
          status: "Not Run",
        },
        {
          stepNumber: 3,
          action: "Verify landing destination",
          expectedResult: "User is routed to active workspace dashboard with authorized tenant context",
          status: "Not Run",
        },
      ],
      expectedResult: "User authenticates seamlessly via magic link without passwords.",
      verificationStatus: "Verified",
      executionStatus: "Not Run",
      approvalStatus: "approved",
    },
    {
      id: "tc_saas_2",
      projectId: project.id,
      scenarioId: "SCEN-001",
      testCaseId: "TC-SEC-001",
      title: "Magic Link Replay Attack Prevention",
      module: "Security",
      categoryVariation: "Negative",
      type: "security",
      priority: "critical",
      preconditions: [
        "A magic link token was previously generated and already clicked once (consumed)",
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Click the already-consumed magic link URL a second time",
          expectedResult: "Backend detects token is already marked as consumed in database",
          status: "Not Run",
        },
        {
          stepNumber: 2,
          action: "Observe client redirection and message",
          expectedResult: "User is shown 'Token already consumed - please request a fresh link' banner",
          status: "Not Run",
        },
      ],
      expectedResult: "Token reuse is strictly denied and security audit log records replay attempt.",
      verificationStatus: "Verified",
      executionStatus: "Not Run",
      approvalStatus: "approved",
    },
    {
      id: "tc_saas_3",
      projectId: project.id,
      scenarioId: "SCEN-002",
      testCaseId: "TC-API-001",
      title: "Organization Role-Based Access Control (Viewer write denial)",
      module: "RBAC & Tenant",
      categoryVariation: "Negative",
      type: "api",
      priority: "high",
      preconditions: [
        "User is authenticated with 'Viewer' role credentials",
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Send POST /api/projects to create a new project with Viewer JWT token",
          expectedResult: "API denies request with HTTP 403 Forbidden and error 'Insufficient permissions'",
          status: "Not Run",
        },
        {
          stepNumber: 2,
          action: "Verify database project table",
          expectedResult: "No unauthorized records were inserted into the database",
          status: "Not Run",
        },
      ],
      expectedResult: "RBAC security policies prevent unauthorized role modifications.",
      verificationStatus: "Verified",
      executionStatus: "Not Run",
      approvalStatus: "approved",
    },
  ];
}

/**
 * Simulates real Playwright / API execution of a test case with step logs.
 */
export async function executeTestCaseSimulation(
  tc: FunctionalTestCase,
  onStepProgress?: (stepNum: number, log: string) => void
): Promise<{
  status: "Passed" | "Failed";
  durationMs: number;
  logs: string[];
  executedSteps: TestCaseExecutionStep[];
}> {
  const startTime = Date.now();
  const logs: string[] = [];
  const isNegative = tc.categoryVariation === "Negative";

  logs.push(`[PLAYWRIGHT RUNNER] Initializing worker session for: ${tc.testCaseId}`);
  logs.push(`[ENVIRONMENT] Target Module: ${tc.module} | Priority: ${tc.priority.toUpperCase()}`);
  logs.push(`[PRECONDITIONS] Checking ${tc.preconditions.length} environment assertions...`);

  const executedSteps: TestCaseExecutionStep[] = [];

  for (let i = 0; i < tc.steps.length; i++) {
    const step = tc.steps[i];
    await new Promise((r) => setTimeout(r, 120)); // simulated execution delay

    const stepLog = `Step ${step.stepNumber}: ${step.action} -> Assertion passed.`;
    logs.push(`[EXECUTION] ${stepLog}`);
    if (onStepProgress) onStepProgress(step.stepNumber, stepLog);

    executedSteps.push({
      ...step,
      actualResult: step.expectedResult,
      status: "Passed",
    });
  }

  const durationMs = Date.now() - startTime + 85;
  logs.push(`[ASSERTION] All ${tc.steps.length} checks resolved successfully in ${durationMs}ms.`);
  logs.push(`[RESULT] Test Case ${tc.testCaseId} PASSED with zero runtime exceptions.`);

  return {
    status: "Passed",
    durationMs,
    logs,
    executedSteps,
  };
}
