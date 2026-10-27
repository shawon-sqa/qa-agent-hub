import { supabase } from "@/lib/supabase/client";
import { ProjectOption } from "@/lib/projects/projectState";
import {
  TestRun,
  TestExecutionResult,
  TestStepExecution,
  EvidenceAttachment,
  TestResultStatus,
} from "@/types/manual-qa";
import { FunctionalTestCase } from "@/types/functional-qa";
import { generateDomainTailoredTestCases } from "@/lib/functional-qa/testCaseEngine";
import { Json } from "@/types/supabase";

/**
 * Generates initial realistic manual test cases tailored to the project
 */
export function buildInitialManualTestCases(project: ProjectOption): FunctionalTestCase[] {
  return generateDomainTailoredTestCases(project);
}

/**
 * Creates default initial demo test run and results if none exist in Supabase
 */
export function generateDefaultTestRun(
  project: ProjectOption,
  testCases: FunctionalTestCase[]
): { run: TestRun; results: TestExecutionResult[] } {
  const runId = `run_${project.id.slice(0, 8)}_${Date.now()}`;
  const now = new Date().toISOString();

  const results: TestExecutionResult[] = testCases.map((tc, idx) => {
    // Keep first 2 passed, 1 failed, 1 blocked, rest not run for rich realistic demo
    let initialStatus: TestResultStatus = "not_run";
    if (idx === 0) initialStatus = "passed";
    else if (idx === 1) initialStatus = "passed";
    else if (idx === 2) initialStatus = "failed";
    else if (idx === 3) initialStatus = "blocked";

    const stepsExecution: TestStepExecution[] = tc.steps.map((s, sIdx) => ({
      stepNumber: s.stepNumber || sIdx + 1,
      action: s.action,
      expectedResult: s.expectedResult,
      actualResult:
        initialStatus === "passed"
          ? "Observed expected behavior as documented."
          : initialStatus === "failed" && sIdx === tc.steps.length - 1
          ? "Unexpected HTTP 500 / unhandled exception dialog encountered."
          : initialStatus === "blocked"
          ? "Prerequisite dependency unavailable in staging environment."
          : undefined,
      status:
        initialStatus === "passed"
          ? "passed"
          : initialStatus === "failed" && sIdx === tc.steps.length - 1
          ? "failed"
          : initialStatus === "failed"
          ? "passed"
          : initialStatus === "blocked"
          ? "blocked"
          : "not_run",
    }));

    const evidenceUrls: EvidenceAttachment[] = [];
    if (initialStatus === "failed") {
      evidenceUrls.push({
        id: `ev_${Date.now()}_1`,
        type: "log",
        title: "Browser Console Exception Log",
        urlOrContent:
          "[ERROR] Uncaught TypeError: Cannot read properties of undefined (reading 'checkoutToken') at bundle.min.js:142:18",
        addedAt: now,
      });
    }

    return {
      id: `res_${runId}_${idx + 1}`,
      runId,
      testCaseId: tc.id,
      testCaseCode: tc.testCaseId,
      title: tc.title,
      module: tc.module,
      priority: tc.priority,
      preconditions: tc.preconditions,
      status: initialStatus,
      stepsExecution,
      notes:
        initialStatus === "failed"
          ? "Issue reproduced on Staging Chrome v128. Needs immediate dev fix before release."
          : undefined,
      evidenceUrls,
      executionTimeMs: initialStatus !== "not_run" ? 42000 + idx * 8500 : 0,
      executedBy: "Shawon Ahmed",
      executedAt: initialStatus !== "not_run" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };
  });

  const passedCount = results.filter((r) => r.status === "passed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const blockedCount = results.filter((r) => r.status === "blocked").length;
  const notRunCount = results.filter((r) => r.status === "not_run").length;

  const run: TestRun = {
    id: runId,
    projectId: project.id,
    name: `Sprint 14 Release Verification - ${project.name}`,
    suiteName: "Full Regression & Manual QA Pack",
    environment: project.environment || "Staging",
    testerName: "Shawon Ahmed",
    status: "in_progress",
    totalTests: results.length,
    passedCount,
    failedCount,
    blockedCount,
    notRunCount,
    startedAt: now,
    notes: `Manual audit targeting domain https://${project.domain}. Executed by Lead QA Architect Shawon Ahmed.`,
    createdAt: now,
    updatedAt: now,
  };

  return { run, results };
}

/**
 * Fetch all test runs for project from Supabase
 */
export async function fetchProjectTestRuns(
  project: ProjectOption,
  testCases: FunctionalTestCase[]
): Promise<{ runs: TestRun[]; activeRunResults: Record<string, TestExecutionResult[]> }> {
  try {
    const { data: runsData, error: runsErr } = await supabase
      .from("test_runs")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (runsErr) {
      console.warn("Could not query test_runs from Supabase:", runsErr.message);
    }

    if (runsData && runsData.length > 0) {
      const runs: TestRun[] = runsData.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        name: r.name,
        suiteName: r.suite_name,
        environment: r.environment,
        testerName: r.tester_name,
        status: r.status,
        totalTests: r.total_tests,
        passedCount: r.passed_count,
        failedCount: r.failed_count,
        blockedCount: r.blocked_count,
        notRunCount: r.not_run_count,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        notes: r.notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      // Fetch all results for these runs
      const runIds = runs.map((r) => r.id);
      const { data: resData } = await supabase
        .from("test_results")
        .select("*")
        .in("run_id", runIds);

      const activeRunResults: Record<string, TestExecutionResult[]> = {};
      runs.forEach((r) => {
        activeRunResults[r.id] = [];
      });

      if (resData && resData.length > 0) {
        resData.forEach((row) => {
          const matchingTc = testCases.find((tc) => tc.id === row.test_case_id || tc.testCaseId === row.test_case_code);
          const stepsExecution = (Array.isArray(row.steps_execution)
            ? (row.steps_execution as unknown[])
            : []) as TestStepExecution[];
          const evidenceUrls = (Array.isArray(row.evidence_urls)
            ? (row.evidence_urls as unknown[])
            : []) as EvidenceAttachment[];

          const res: TestExecutionResult = {
            id: row.id,
            runId: row.run_id,
            testCaseId: row.test_case_id,
            testCaseCode: row.test_case_code,
            title: row.title,
            module: matchingTc?.module || "Core",
            priority: matchingTc?.priority || "medium",
            preconditions: matchingTc?.preconditions || [],
            status: row.status,
            stepsExecution,
            notes: row.notes || undefined,
            evidenceUrls,
            executionTimeMs: row.execution_time_ms || 0,
            executedBy: row.executed_by,
            executedAt: row.executed_at || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };

          if (!activeRunResults[row.run_id]) {
            activeRunResults[row.run_id] = [];
          }
          activeRunResults[row.run_id].push(res);
        });
      }

      // If a run has 0 results in DB, populate it from testCases so tester can execute
      runs.forEach((run) => {
        if (!activeRunResults[run.id] || activeRunResults[run.id].length === 0) {
          activeRunResults[run.id] = testCases.map((tc, idx) => ({
            id: `res_${run.id}_${idx + 1}`,
            runId: run.id,
            testCaseId: tc.id,
            testCaseCode: tc.testCaseId,
            title: tc.title,
            module: tc.module,
            priority: tc.priority,
            preconditions: tc.preconditions,
            status: "not_run",
            stepsExecution: tc.steps.map((s, sIdx) => ({
              stepNumber: s.stepNumber || sIdx + 1,
              action: s.action,
              expectedResult: s.expectedResult,
              status: "not_run",
            })),
            evidenceUrls: [],
            executionTimeMs: 0,
            executedBy: run.testerName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
      });

      return { runs, activeRunResults };
    }

    // Supabase has no runs: Return realistic default
    const fallback = generateDefaultTestRun(project, testCases);
    return {
      runs: [fallback.run],
      activeRunResults: { [fallback.run.id]: fallback.results },
    };
  } catch (err) {
    console.error("Error in fetchProjectTestRuns:", err);
    const fallback = generateDefaultTestRun(project, testCases);
    return {
      runs: [fallback.run],
      activeRunResults: { [fallback.run.id]: fallback.results },
    };
  }
}

/**
 * Creates a brand new Test Run and saves it to Supabase
 */
export async function createNewTestRun(
  project: ProjectOption,
  name: string,
  suiteName: string,
  environment: string,
  testerName: string,
  testCases: FunctionalTestCase[]
): Promise<{ run: TestRun; results: TestExecutionResult[] }> {
  const now = new Date().toISOString();
  const runId = crypto.randomUUID();

  const results: TestExecutionResult[] = testCases.map((tc, idx) => ({
    id: crypto.randomUUID(),
    runId,
    testCaseId: tc.id,
    testCaseCode: tc.testCaseId,
    title: tc.title,
    module: tc.module,
    priority: tc.priority,
    preconditions: tc.preconditions,
    status: "not_run",
    stepsExecution: tc.steps.map((s, sIdx) => ({
      stepNumber: s.stepNumber || sIdx + 1,
      action: s.action,
      expectedResult: s.expectedResult,
      status: "not_run",
    })),
    evidenceUrls: [],
    executionTimeMs: 0,
    executedBy: testerName,
    createdAt: now,
    updatedAt: now,
  }));

  const run: TestRun = {
    id: runId,
    projectId: project.id,
    name,
    suiteName,
    environment,
    testerName,
    status: "in_progress",
    totalTests: results.length,
    passedCount: 0,
    failedCount: 0,
    blockedCount: 0,
    notRunCount: results.length,
    startedAt: now,
    notes: `Test run initialized for ${suiteName} on ${environment}`,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Save run to Supabase
    await supabase.from("test_runs").insert({
      id: run.id,
      project_id: run.projectId,
      name: run.name,
      suite_name: run.suiteName,
      environment: run.environment,
      tester_name: run.testerName,
      status: run.status,
      total_tests: run.totalTests,
      passed_count: run.passedCount,
      failed_count: run.failedCount,
      blocked_count: run.blockedCount,
      not_run_count: run.notRunCount,
      started_at: run.startedAt,
      notes: run.notes,
    });

    // Save initial results to Supabase
    const dbResults = results.map((r) => ({
      id: r.id,
      run_id: r.runId,
      test_case_id: r.testCaseId || null,
      test_case_code: r.testCaseCode,
      title: r.title,
      status: r.status,
      steps_execution: r.stepsExecution as unknown as Json,
      evidence_urls: r.evidenceUrls as unknown as Json,
      execution_time_ms: r.executionTimeMs,
      executed_by: r.executedBy,
    }));

    await supabase.from("test_results").insert(dbResults);
  } catch (err) {
    console.warn("Could not persist new test run to Supabase (using memory state):", err);
  }

  return { run, results };
}

/**
 * Updates a specific Test Execution Result in Supabase and recalculates run stats
 */
export async function saveTestExecutionResult(
  run: TestRun,
  result: TestExecutionResult,
  allRunResults: TestExecutionResult[]
): Promise<TestRun> {
  const now = new Date().toISOString();
  const updatedResult: TestExecutionResult = {
    ...result,
    executedAt: now,
    updatedAt: now,
  };

  // Recalculate counts
  const updatedResults = allRunResults.map((r) => (r.id === result.id ? updatedResult : r));
  const passedCount = updatedResults.filter((r) => r.status === "passed").length;
  const failedCount = updatedResults.filter((r) => r.status === "failed").length;
  const blockedCount = updatedResults.filter((r) => r.status === "blocked").length;
  const notRunCount = updatedResults.filter((r) => r.status === "not_run").length;

  const isCompleted = notRunCount === 0;

  const updatedRun: TestRun = {
    ...run,
    passedCount,
    failedCount,
    blockedCount,
    notRunCount,
    status: isCompleted ? "completed" : run.status,
    completedAt: isCompleted ? now : run.completedAt,
    updatedAt: now,
  };

  try {
    // 1. Update test_results
    await supabase.from("test_results").upsert({
      id: updatedResult.id,
      run_id: updatedResult.runId,
      test_case_id: updatedResult.testCaseId || null,
      test_case_code: updatedResult.testCaseCode,
      title: updatedResult.title,
      status: updatedResult.status,
      steps_execution: updatedResult.stepsExecution as unknown as Json,
      notes: updatedResult.notes || null,
      evidence_urls: updatedResult.evidenceUrls as unknown as Json,
      execution_time_ms: updatedResult.executionTimeMs,
      executed_by: updatedResult.executedBy,
      executed_at: updatedResult.executedAt,
      updated_at: now,
    });

    // 2. Update test_runs
    await supabase
      .from("test_runs")
      .update({
        passed_count: updatedRun.passedCount,
        failed_count: updatedRun.failedCount,
        blocked_count: updatedRun.blockedCount,
        not_run_count: updatedRun.notRunCount,
        status: updatedRun.status,
        completed_at: updatedRun.completedAt,
        updated_at: now,
      })
      .eq("id", updatedRun.id);
  } catch (err) {
    console.warn("Could not sync test result update to Supabase:", err);
  }

  return updatedRun;
}
