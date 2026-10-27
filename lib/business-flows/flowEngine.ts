import {
  BusinessFlow,
  FlowStep,
  FlowValidationResult,
  DecisionBranch,
} from "@/types/business-flows";
import { TenSectionAnalysis, VerificationStatus } from "@/types/website-analysis";
import { ProjectOption } from "@/lib/projects/projectState";

/**
 * Validates a Business Flow and computes an audit-grade QA health report.
 */
export function validateBusinessFlow(flow: BusinessFlow): FlowValidationResult {
  const steps = flow.steps || [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const unhandledFailureBranches: Array<{ stepId: string; stepTitle: string; reason: string }> = [];
  const orphanedSteps: Array<{ stepId: string; stepTitle: string }> = [];

  const hasStartNode = Boolean(
    flow.startPoint && flow.startPoint.trim().length > 0 && steps.length > 0
  );
  if (!hasStartNode) {
    warnings.push("Missing Initial Entry / Start Node for this business workflow.");
    recommendations.push("Define a specific starting URL or user trigger event.");
  }

  const hasTerminalNode = Boolean(
    (flow.endPoint && flow.endPoint.trim().length > 0) ||
      steps.some((s) => s.type === "terminal" || s.nextStepId === "TERMINAL_SUCCESS")
  );
  if (!hasTerminalNode) {
    warnings.push("Missing Terminal / Completion Node. The workflow does not terminate in a finalized state.");
    recommendations.push("Add a terminal step representing successful transaction completion or confirmation screen.");
  }

  // Check decision and verification steps for failure branches
  const stepIdSet = new Set(steps.map((s) => s.id));

  steps.forEach((step) => {
    if (step.type === "decision" || step.type === "verification") {
      const branches = step.branches || [];
      const hasFailureBranch =
        branches.some(
          (b) =>
            b.outcomeType === "failure" ||
            b.condition.toLowerCase().includes("fail") ||
            b.condition.toLowerCase().includes("invalid") ||
            b.condition.toLowerCase().includes("error") ||
            b.condition.toLowerCase().includes("timeout")
        ) ||
        (step.failurePoints && step.failurePoints.length > 0);

      if (!hasFailureBranch) {
        unhandledFailureBranches.push({
          stepId: step.id,
          stepTitle: step.title,
          reason: `Step ${step.stepNumber} (${step.title}) lacks an explicit negative/failure branch or retry recovery path.`,
        });
        warnings.push(`Step ${step.stepNumber} has unhandled failure states (validation or network error).`);
      }
    }

    // Check orphaned next step references
    if (
      step.nextStepId &&
      step.nextStepId !== "TERMINAL_SUCCESS" &&
      step.nextStepId !== "TERMINAL_FAILURE" &&
      !stepIdSet.has(step.nextStepId)
    ) {
      orphanedSteps.push({
        stepId: step.id,
        stepTitle: step.title,
      });
      warnings.push(`Step ${step.stepNumber} references non-existent target step ID "${step.nextStepId}".`);
    }
  });

  if (unhandledFailureBranches.length > 0) {
    recommendations.push(
      `Add explicit exception paths (e.g. invalid credentials, session timeout, payment decline) to ${unhandledFailureBranches.length} decision point(s).`
    );
  }

  // Calculate Health Score
  let score = 100;
  if (!hasStartNode) score -= 20;
  if (!hasTerminalNode) score -= 20;
  score -= unhandledFailureBranches.length * 15;
  score -= orphanedSteps.length * 10;
  const healthScore = Math.max(20, Math.min(100, score));

  return {
    hasStartNode,
    hasTerminalNode,
    unhandledFailureBranches,
    orphanedSteps,
    healthScore,
    warnings,
    recommendations,
  };
}

/**
 * Automatically synthesizes comprehensive business flows from a TenSectionAnalysis or domain metadata.
 */
export function generateBusinessFlowsFromAnalysis(
  analysis: TenSectionAnalysis | null | undefined,
  project: ProjectOption
): BusinessFlow[] {
  const flows: BusinessFlow[] = [];
  const domain = project.domain.toLowerCase();
  const projectName = project.name;

  // 1. Extract from 10-Section Analysis Workflow Journey
  const workflowJourney = analysis?.section4_featuresAndWorkflows?.workflowJourney;
  if (workflowJourney && workflowJourney.steps && workflowJourney.steps.length > 0) {
    const stepsData = workflowJourney.steps;
    const flowSteps: FlowStep[] = stepsData.map((s, idx) => {
      const isDecision =
        s.stageName.toLowerCase().includes("auth") ||
        s.stageName.toLowerCase().includes("payment") ||
        s.stageName.toLowerCase().includes("check") ||
        s.stageName.toLowerCase().includes("verify");
      const isTerminal = idx === stepsData.length - 1;

      const stepType = isTerminal ? "terminal" : isDecision ? "decision" : "action";

      const stepId = `step_${idx + 1}`;
      const nextStepId = isTerminal
        ? "TERMINAL_SUCCESS"
        : `step_${idx + 2}`;

      const branches: DecisionBranch[] = [];
      if (isDecision) {
        branches.push({
          id: `br_${idx}_success`,
          condition: "Credentials / Input valid & authorized",
          targetStepId: nextStepId,
          outcomeType: "success",
          description: "Proceed to next operational stage",
        });
        branches.push({
          id: `br_${idx}_failure`,
          condition: "Validation fails or server returns error (4xx/5xx)",
          targetStepId: "TERMINAL_FAILURE",
          outcomeType: "failure",
          description: "Display actionable inline validation message & allow user retry",
        });
      }

      return {
        id: stepId,
        stepNumber: s.stepNumber || idx + 1,
        title: s.stageName,
        type: stepType,
        userAction: s.userAction,
        systemResponse: s.systemResponse,
        failurePoints: s.failurePoints || [],
        branches: branches.length > 0 ? branches : undefined,
        nextStepId,
        linkedRequirementCode: `REQ-BIZ-${String(idx + 1).padStart(3, "0")}`,
        linkedTestCaseId: `TC-E2E-${String(idx + 1).padStart(3, "0")}`,
      };
    });

    const flow1: BusinessFlow = {
      id: `flow_journey_${Date.now()}_1`,
      projectId: project.id,
      flowCode: "FLOW-001",
      title: `${workflowJourney.primaryJourney || "Primary User Workflow"}`,
      description: `Complete step-by-step user journey discovered during automated website crawling of ${project.domain}.`,
      category: "User Journey",
      status: "approved",
      verificationStatus: "Verified",
      startPoint: workflowJourney.startingPoint || `https://${project.domain}`,
      endPoint: flowSteps[flowSteps.length - 1]?.title || "Confirmation & Receipt",
      steps: flowSteps,
      validation: {
        hasStartNode: true,
        hasTerminalNode: true,
        unhandledFailureBranches: [],
        orphanedSteps: [],
        healthScore: 95,
        warnings: [],
        recommendations: [],
      },
      traceability: {
        sourceEvidence: `Crawled route topology from https://${project.domain}`,
        sourceUrl: `https://${project.domain}`,
        linkedRequirements: flowSteps.map((s) => s.linkedRequirementCode!).filter(Boolean),
        linkedTestCases: flowSteps.map((s) => s.linkedTestCaseId!).filter(Boolean),
        verifiedAt: new Date().toISOString(),
      },
    };

    flow1.validation = validateBusinessFlow(flow1);
    flows.push(flow1);
  }

  // If no flows were created or fallback is required, produce realistic domain flows
  if (flows.length === 0) {
    return generateDomainTailoredBusinessFlows(project);
  }

  return flows;
}

/**
 * Domain-tailored Business Flows for E-commerce, FinTech, and Cloud SaaS.
 */
export function generateDomainTailoredBusinessFlows(project: ProjectOption): BusinessFlow[] {
  const domain = project.domain.toLowerCase();
  const name = project.name;

  if (domain.includes("daraz") || domain.includes("shop") || domain.includes("luxwear") || domain.includes("store")) {
    // E-Commerce Marketplace Business Flows
    const flow1: BusinessFlow = {
      id: `flow_ecom_1`,
      projectId: project.id,
      flowCode: "FLOW-001",
      title: "Product Search to Cash on Delivery (COD) Checkout",
      description: "End-to-end purchasing workflow from keyword search through cart reservation and COD order placement.",
      category: "Checkout & Payment",
      status: "approved",
      verificationStatus: "Verified",
      startPoint: `https://${project.domain}/search`,
      endPoint: `https://${project.domain}/order/success`,
      steps: [
        {
          id: "step_1",
          stepNumber: 1,
          title: "Search Catalog & Select Product",
          type: "action",
          userAction: "Visitor enters search query (e.g. 'Wireless Earbuds') and clicks on product card",
          systemResponse: "Renders Product Details Page with verified stock, pricing, and seller rating in < 400ms",
          nextStepId: "step_2",
          linkedRequirementCode: "REQ-FUNC-001",
          linkedTestCaseId: "TC-E2E-001",
        },
        {
          id: "step_2",
          stepNumber: 2,
          title: "Add to Cart & Reserve Stock",
          type: "action",
          userAction: "Clicks 'Add to Cart' with selected SKU variant and quantity",
          systemResponse: "Atomic inventory reservation lock created for 15 minutes; cart drawer updates counter",
          nextStepId: "step_3",
          linkedRequirementCode: "REQ-BIZ-001",
          linkedTestCaseId: "TC-E2E-002",
        },
        {
          id: "step_3",
          stepNumber: 3,
          title: "Delivery Address & Phone Verification",
          type: "decision",
          userAction: "Enters recipient delivery address and contact phone number",
          systemResponse: "Validates postal code coverage and calculates exact shipping fees",
          failurePoints: ["Undeliverable postal code", "Invalid mobile phone format"],
          branches: [
            {
              id: "br_3_valid",
              condition: "Address is within serviceable delivery zone",
              targetStepId: "step_4",
              outcomeType: "success",
              description: "Proceed to payment method selection",
            },
            {
              id: "br_3_invalid",
              condition: "Address outside serviceable courier delivery zone",
              targetStepId: "TERMINAL_FAILURE",
              outcomeType: "failure",
              description: "Display postal code warning and suggest alternative pickup point",
            },
          ],
          nextStepId: "step_4",
          linkedRequirementCode: "REQ-USR-001",
          linkedTestCaseId: "TC-E2E-003",
        },
        {
          id: "step_4",
          stepNumber: 4,
          title: "Payment Selection & Fraud Verification",
          type: "verification",
          userAction: "Customer selects 'Cash on Delivery' and clicks 'Confirm Order'",
          systemResponse: "Runs OTP SMS challenge if order value > $100; generates immutable invoice and orders queue record",
          failurePoints: ["SMS OTP timeout (> 2 minutes)", "Suspicious rapid repeat orders from same IP"],
          branches: [
            {
              id: "br_4_approved",
              condition: "OTP verified or low-risk order profile",
              targetStepId: "step_5",
              outcomeType: "success",
              description: "Transition order state to 'Confirmed - Awaiting Fulfillment'",
            },
            {
              id: "br_4_otp_fail",
              condition: "Customer fails OTP verification 3 times",
              targetStepId: "TERMINAL_FAILURE",
              outcomeType: "failure",
              description: "Lock checkout session for 10 minutes and release reserved inventory",
            },
          ],
          nextStepId: "step_5",
          linkedRequirementCode: "REQ-SEC-001",
          linkedTestCaseId: "TC-SEC-001",
        },
        {
          id: "step_5",
          stepNumber: 5,
          title: "Order Placed Confirmation & Tracking",
          type: "terminal",
          userAction: "Customer lands on Order Success page with order tracking number",
          systemResponse: "Sends order confirmation SMS/email and renders live courier tracking link",
          nextStepId: "TERMINAL_SUCCESS",
          linkedRequirementCode: "REQ-FUNC-002",
          linkedTestCaseId: "TC-E2E-004",
        },
      ],
      validation: {
        hasStartNode: true,
        hasTerminalNode: true,
        unhandledFailureBranches: [],
        orphanedSteps: [],
        healthScore: 100,
        warnings: [],
        recommendations: [],
      },
      traceability: {
        sourceEvidence: "E-Commerce Checkout Pipeline",
        sourceUrl: `https://${project.domain}/cart`,
        linkedRequirements: ["REQ-FUNC-001", "REQ-BIZ-001", "REQ-SEC-001"],
        linkedTestCases: ["TC-E2E-001", "TC-E2E-002", "TC-SEC-001"],
        verifiedAt: new Date().toISOString(),
      },
    };

    flow1.validation = validateBusinessFlow(flow1);
    return [flow1];
  }

  // Cloud SaaS / OpsROI / FinTech Business Flows
  const flow1: BusinessFlow = {
    id: `flow_saas_1`,
    projectId: project.id,
    flowCode: "FLOW-001",
    title: "Passwordless Magic Link Authentication & Workspace Onboarding",
    description: "Session initiation from landing page, token verification via email link, and organization workspace routing.",
    category: "Authentication",
    status: "approved",
    verificationStatus: "Verified",
    startPoint: `https://${project.domain}/auth/login`,
    endPoint: `https://${project.domain}/dashboard`,
    steps: [
      {
        id: "step_1",
        stepNumber: 1,
        title: "Submit Email for Magic Link",
        type: "action",
        userAction: "User inputs verified corporate email and clicks 'Send Magic Link'",
        systemResponse: "Generates 256-bit single-use cryptographic token with 15-minute TTL; dispatches email",
        nextStepId: "step_2",
        linkedRequirementCode: "REQ-SEC-001",
        linkedTestCaseId: "TC-SEC-001",
      },
      {
        id: "step_2",
        stepNumber: 2,
        title: "Magic Link Token Validation & Consume",
        type: "decision",
        userAction: "User clicks verification URL in inbox",
        systemResponse: "Validates token hash, verifies expiration (< 15 min), and immediately consumes token to prevent replay",
        failurePoints: ["Token expired (> 15 minutes)", "Token already consumed (replay attempt)"],
        branches: [
          {
            id: "br_2_valid",
            condition: "Token is active and unconsumed",
            targetStepId: "step_3",
            outcomeType: "success",
            description: "Issue HTTPS secure JWT cookies and route to workspace resolver",
          },
          {
            id: "br_2_expired",
            condition: "Token has expired or was already used",
            targetStepId: "TERMINAL_FAILURE",
            outcomeType: "failure",
            description: "Redirect to /auth/login with 'Token Expired - Request New Link' banner",
          },
        ],
        nextStepId: "step_3",
        linkedRequirementCode: "REQ-SEC-002",
        linkedTestCaseId: "TC-SEC-002",
      },
      {
        id: "step_3",
        stepNumber: 3,
        title: "Multi-Tenant Workspace & Role Resolution",
        type: "verification",
        userAction: "Application resolves user's organization memberships and RBAC permissions",
        systemResponse: "Loads project workspaces matching tenant ID and enforces granular read/write policy",
        failurePoints: ["User has zero assigned workspaces", "User account suspended"],
        branches: [
          {
            id: "br_3_active",
            condition: "Valid active workspace membership detected",
            targetStepId: "step_4",
            outcomeType: "success",
            description: "Grant full dashboard session credentials",
          },
          {
            id: "br_3_none",
            condition: "No workspace exists for user",
            targetStepId: "TERMINAL_FAILURE",
            outcomeType: "alternative",
            description: "Route to /onboarding/create-workspace wizard",
          },
        ],
        nextStepId: "step_4",
        linkedRequirementCode: "REQ-FUNC-001",
        linkedTestCaseId: "TC-E2E-001",
      },
      {
        id: "step_4",
        stepNumber: 4,
        title: "Executive Quality Dashboard Ready",
        type: "terminal",
        userAction: "User arrives on main dashboard with active project telemetry loaded",
        systemResponse: "Displays real-time pass rate, automated test runs, and requirement traceability metrics",
        nextStepId: "TERMINAL_SUCCESS",
        linkedRequirementCode: "REQ-FUNC-002",
        linkedTestCaseId: "TC-E2E-002",
      },
    ],
    validation: {
      hasStartNode: true,
      hasTerminalNode: true,
      unhandledFailureBranches: [],
      orphanedSteps: [],
      healthScore: 100,
      warnings: [],
      recommendations: [],
    },
    traceability: {
      sourceEvidence: "Authentication Microservice",
      sourceUrl: `https://${project.domain}/auth/login`,
      linkedRequirements: ["REQ-SEC-001", "REQ-SEC-002", "REQ-FUNC-001"],
      linkedTestCases: ["TC-SEC-001", "TC-SEC-002", "TC-E2E-001"],
      verifiedAt: new Date().toISOString(),
    },
  };

  flow1.validation = validateBusinessFlow(flow1);
  return [flow1];
}
