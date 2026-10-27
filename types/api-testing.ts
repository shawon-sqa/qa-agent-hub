export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export interface ApiHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiQueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type ApiAssertionType = "status_code" | "response_time" | "json_body" | "header_present" | "content_type";

export interface ApiAssertion {
  id: string;
  type: ApiAssertionType;
  target?: string; // e.g. "data.token" or "code"
  operator: "equals" | "less_than" | "contains" | "exists";
  expected: string;
  actual?: string;
  passed?: boolean;
}

export interface ApiEnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export interface ApiResponse {
  statusCode: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  body: string;
  parsedJson?: unknown;
  assertionsResults: {
    id: string;
    type: string;
    expected: string;
    actual: string;
    passed: boolean;
    message: string;
  }[];
  timestamp: string;
}

export interface ApiRequestItem {
  id: string;
  projectId: string;
  name: string;
  module: string;
  method: HttpMethod;
  url: string;
  headers: ApiHeader[];
  params: ApiQueryParam[];
  bodyType: "json" | "form" | "raw" | "none";
  bodyContent: string;
  assertions: ApiAssertion[];
  lastResponse?: ApiResponse;
}

export interface ApiCollectionGroup {
  moduleName: string;
  requests: ApiRequestItem[];
}
