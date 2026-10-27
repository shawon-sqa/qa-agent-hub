export interface PageObjectLocator {
  name: string;
  selector: string;
  description: string;
}

export interface PageObjectAction {
  name: string;
  params: string[];
  code: string;
  description: string;
}

export interface PlaywrightPageObject {
  id: string;
  name: string;
  filename: string;
  className: string;
  description: string;
  locators: PageObjectLocator[];
  actions: PageObjectAction[];
  code: string;
}

export interface PlaywrightSpecFile {
  id: string;
  testCaseCode: string;
  title: string;
  filename: string;
  module: string;
  browser: "chromium" | "firefox" | "webkit";
  code: string;
  status: "ready" | "running" | "passed" | "failed";
  durationMs?: number;
  lastRunAt?: string;
}

export interface PlaywrightExecutionLog {
  id: string;
  timestamp: string;
  level: "info" | "step" | "pass" | "fail" | "warn";
  workerId: number;
  message: string;
}

export interface PlaywrightTraceStep {
  stepIndex: number;
  action: string;
  targetSelector: string;
  durationMs: number;
  status: "passed" | "failed";
  screenshotUrl: string;
}

export interface PlaywrightTraceArtifact {
  id: string;
  specId: string;
  testTitle: string;
  totalDurationMs: number;
  steps: PlaywrightTraceStep[];
  networkCalls: {
    method: string;
    url: string;
    status: number;
    durationMs: number;
  }[];
  consoleErrors: string[];
}
