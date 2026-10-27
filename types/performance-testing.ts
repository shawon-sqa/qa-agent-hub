export type WebVitalRating = "good" | "needs-improvement" | "poor";

export interface WebVitalMetric {
  name: string;
  acronym: string;
  value: number;
  unit: "s" | "ms" | "";
  rating: WebVitalRating;
  threshold: string;
  target: string;
  description: string;
}

export interface CoreWebVitals {
  lcp: WebVitalMetric;
  inp: WebVitalMetric;
  cls: WebVitalMetric;
  fcp: WebVitalMetric;
  ttfb: WebVitalMetric;
  speedIndex: WebVitalMetric;
}

export interface PerformanceMetricBreakdown {
  dnsLookupMs: number;
  tcpHandshakeMs: number;
  tlsNegotiationMs: number;
  ttfbMs: number;
  downloadMs: number;
  totalLatencyMs: number;
  payloadSizeBytes: number;
  payloadSizeKb: number;
  compression: "brotli" | "gzip" | "none";
  cacheStatus: "HIT" | "MISS" | "NO-CACHE" | "MAX-AGE";
  httpVersion: string;
  contentType: string;
  statusCode: number;
}

export interface PerformanceScoreBreakdown {
  overallScore: number; // 0 - 100
  latencyScore: number;
  payloadScore: number;
  cachingScore: number;
  webVitalsScore: number;
}

export interface LoadTestScenarioConfig {
  targetUrl: string;
  virtualUsers: number;
  durationSeconds: number;
  rampUpSeconds: number;
  slaMaxLatencyMs: number;
  scenarioName: string;
}

export interface PerformanceAuditRun {
  id: string;
  project_id: string;
  target_url: string;
  tested_by: string;
  performance_score: number;
  latency_ms: number;
  payload_size_kb: number;
  web_vitals: CoreWebVitals;
  metrics: PerformanceMetricBreakdown;
  score_breakdown: PerformanceScoreBreakdown;
  k6_script: string;
  artillery_script: string;
  status: "completed" | "in_progress" | "failed";
  created_at: string;
}
