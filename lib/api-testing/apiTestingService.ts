import { ProjectOption } from "@/lib/projects/projectState";
import {
  ApiRequestItem,
  ApiEnvironmentVariable,
  ApiResponse,
  ApiCollectionGroup,
} from "@/types/api-testing";

export function getDefaultEnvironmentVariables(project: ProjectOption): ApiEnvironmentVariable[] {
  return [
    {
      id: "env_1",
      key: "baseUrl",
      value: `https://${project.domain || "api.example.com"}`,
      description: "Root domain for API gateway requests",
    },
    {
      id: "env_2",
      key: "authToken",
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNoYXdvbiBBaG1lZCIsImlhdCI6MTUxNjIzOTAyMn0",
      description: "Bearer authentication JWT token",
    },
    {
      id: "env_3",
      key: "apiKey",
      value: "qa_live_sec_9941a82f",
      description: "Client API Key for gateway access",
    },
  ];
}

export function getDefaultApiCollections(project: ProjectOption): ApiRequestItem[] {
  const isEcommerce =
    project.name.toLowerCase().includes("commerce") ||
    project.name.toLowerCase().includes("checkout") ||
    project.name.toLowerCase().includes("store");
  const isBanking =
    project.name.toLowerCase().includes("bank") ||
    project.name.toLowerCase().includes("fintech");

  if (isEcommerce) {
    return [
      {
        id: "req_ecom_1",
        projectId: project.id,
        name: "Search Product Catalog",
        module: "Catalog & Products",
        method: "GET",
        url: "{{baseUrl}}/api/v1/products/search",
        headers: [
          { id: "h1", key: "Accept", value: "application/json", enabled: true },
          { id: "h2", key: "Authorization", value: "Bearer {{authToken}}", enabled: true },
        ],
        params: [
          { id: "p1", key: "query", value: "jacket", enabled: true },
          { id: "p2", key: "limit", value: "10", enabled: true },
          { id: "p3", key: "inStock", value: "true", enabled: true },
        ],
        bodyType: "none",
        bodyContent: "",
        assertions: [
          { id: "a1", type: "status_code", expected: "200", operator: "equals" },
          { id: "a2", type: "response_time", expected: "600", operator: "less_than" },
          { id: "a3", type: "content_type", expected: "application/json", operator: "contains" },
        ],
      },
      {
        id: "req_ecom_2",
        projectId: project.id,
        name: "Add Item to Shopping Cart",
        module: "Cart & Checkout",
        method: "POST",
        url: "{{baseUrl}}/api/v1/cart/items",
        headers: [
          { id: "h1", key: "Content-Type", value: "application/json", enabled: true },
          { id: "h2", key: "Authorization", value: "Bearer {{authToken}}", enabled: true },
        ],
        params: [],
        bodyType: "json",
        bodyContent: JSON.stringify(
          {
            productId: "prod_lux_994",
            quantity: 2,
            selectedVariant: { size: "L", color: "Midnight Navy" },
          },
          null,
          2
        ),
        assertions: [
          { id: "a1", type: "status_code", expected: "200", operator: "equals" },
          { id: "a2", type: "response_time", expected: "800", operator: "less_than" },
        ],
      },
      {
        id: "req_ecom_3",
        projectId: project.id,
        name: "Validate Discount Coupon Code",
        module: "Cart & Checkout",
        method: "POST",
        url: "{{baseUrl}}/api/v1/promo/apply",
        headers: [
          { id: "h1", key: "Content-Type", value: "application/json", enabled: true },
          { id: "h2", key: "X-Api-Key", value: "{{apiKey}}", enabled: true },
        ],
        params: [],
        bodyType: "json",
        bodyContent: JSON.stringify({ couponCode: "SUMMER2026", cartTotal: 149.99 }, null, 2),
        assertions: [
          { id: "a1", type: "status_code", expected: "200", operator: "equals" },
          { id: "a2", type: "response_time", expected: "500", operator: "less_than" },
        ],
      },
    ];
  }

  if (isBanking) {
    return [
      {
        id: "req_bank_1",
        projectId: project.id,
        name: "Authenticate Customer & Issue JWT",
        module: "Authentication",
        method: "POST",
        url: "{{baseUrl}}/api/v1/auth/login",
        headers: [
          { id: "h1", key: "Content-Type", value: "application/json", enabled: true },
          { id: "h2", key: "X-Client-Platform", value: "Web-Portal", enabled: true },
        ],
        params: [],
        bodyType: "json",
        bodyContent: JSON.stringify(
          {
            username: "shawon.ahmed",
            password: "SecureTestPassword!2026",
            otpCode: "492019",
          },
          null,
          2
        ),
        assertions: [
          { id: "a1", type: "status_code", expected: "200", operator: "equals" },
          { id: "a2", type: "response_time", expected: "500", operator: "less_than" },
        ],
      },
      {
        id: "req_bank_2",
        projectId: project.id,
        name: "Fetch Account Balances & Transactions",
        module: "Accounts & Balances",
        method: "GET",
        url: "{{baseUrl}}/api/v1/accounts/summary",
        headers: [
          { id: "h1", key: "Accept", value: "application/json", enabled: true },
          { id: "h2", key: "Authorization", value: "Bearer {{authToken}}", enabled: true },
        ],
        params: [
          { id: "p1", key: "currency", value: "USD", enabled: true },
          { id: "p2", key: "includePending", value: "true", enabled: true },
        ],
        bodyType: "none",
        bodyContent: "",
        assertions: [
          { id: "a1", type: "status_code", expected: "200", operator: "equals" },
          { id: "a2", type: "response_time", expected: "400", operator: "less_than" },
        ],
      },
      {
        id: "req_bank_3",
        projectId: project.id,
        name: "Execute Fund Transfer",
        module: "Transfers & Wires",
        method: "POST",
        url: "{{baseUrl}}/api/v1/transfers/execute",
        headers: [
          { id: "h1", key: "Content-Type", value: "application/json", enabled: true },
          { id: "h2", key: "Authorization", value: "Bearer {{authToken}}", enabled: true },
          { id: "h3", key: "Idempotency-Key", value: "idemp_trans_8829104", enabled: true },
        ],
        params: [],
        bodyType: "json",
        bodyContent: JSON.stringify(
          {
            sourceAccountId: "acc_checking_0192",
            targetAccountId: "acc_savings_9941",
            amount: 250.0,
            currency: "USD",
            memo: "Monthly Savings Allocation",
          },
          null,
          2
        ),
        assertions: [
          { id: "a1", type: "status_code", expected: "200", operator: "equals" },
          { id: "a2", type: "response_time", expected: "700", operator: "less_than" },
        ],
      },
    ];
  }

  // Default SaaS Platform API Collection
  return [
    {
      id: "req_saas_1",
      projectId: project.id,
      name: "Gateway Health & Readiness Check",
      module: "System & Health",
      method: "GET",
      url: "{{baseUrl}}/api/health",
      headers: [
        { id: "h1", key: "Accept", value: "application/json", enabled: true },
      ],
      params: [],
      bodyType: "none",
      bodyContent: "",
      assertions: [
        { id: "a1", type: "status_code", expected: "200", operator: "equals" },
        { id: "a2", type: "response_time", expected: "300", operator: "less_than" },
      ],
    },
    {
      id: "req_saas_2",
      projectId: project.id,
      name: "List Workspaces & Projects",
      module: "Workspaces",
      method: "GET",
      url: "{{baseUrl}}/api/v1/workspaces",
      headers: [
        { id: "h1", key: "Accept", value: "application/json", enabled: true },
        { id: "h2", key: "Authorization", value: "Bearer {{authToken}}", enabled: true },
      ],
      params: [
        { id: "p1", key: "page", value: "1", enabled: true },
        { id: "p2", key: "pageSize", value: "20", enabled: true },
      ],
      bodyType: "none",
      bodyContent: "",
      assertions: [
        { id: "a1", type: "status_code", expected: "200", operator: "equals" },
        { id: "a2", type: "response_time", expected: "500", operator: "less_than" },
      ],
    },
    {
      id: "req_saas_3",
      projectId: project.id,
      name: "Create Project Resource",
      module: "Workspaces",
      method: "POST",
      url: "{{baseUrl}}/api/v1/projects",
      headers: [
        { id: "h1", key: "Content-Type", value: "application/json", enabled: true },
        { id: "h2", key: "Authorization", value: "Bearer {{authToken}}", enabled: true },
      ],
      params: [],
      bodyType: "json",
      bodyContent: JSON.stringify(
        {
          name: "Staging Automated Suite",
          environment: "Staging",
          notificationsEnabled: true,
        },
        null,
        2
      ),
      assertions: [
        { id: "a1", type: "status_code", expected: "200", operator: "equals" },
      ],
    },
  ];
}

/**
 * Replace environment variables in string like {{baseUrl}} with active variable values
 */
export function interpolateVariables(
  text: string,
  variables: ApiEnvironmentVariable[]
): string {
  let result = text;
  variables.forEach((v) => {
    const pattern = new RegExp(`{{\\s*${v.key}\\s*}}`, "g");
    result = result.replace(pattern, v.value);
  });
  return result;
}

/**
 * Execute API Request via server proxy
 */
export async function executeApiRequest(
  request: ApiRequestItem,
  variables: ApiEnvironmentVariable[]
): Promise<ApiResponse> {
  const resolvedUrl = interpolateVariables(request.url, variables);

  const resolvedHeaders: Record<string, string> = {};
  request.headers
    .filter((h) => h.enabled && h.key.trim().length > 0)
    .forEach((h) => {
      resolvedHeaders[interpolateVariables(h.key, variables)] = interpolateVariables(
        h.value,
        variables
      );
    });

  const resolvedParams: Record<string, string> = {};
  request.params
    .filter((p) => p.enabled && p.key.trim().length > 0)
    .forEach((p) => {
      resolvedParams[interpolateVariables(p.key, variables)] = interpolateVariables(
        p.value,
        variables
      );
    });

  const resolvedBody =
    request.bodyType !== "none" && request.bodyContent
      ? interpolateVariables(request.bodyContent, variables)
      : "";

  const response = await fetch("/api/api-test-runner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: resolvedUrl,
      method: request.method,
      headers: resolvedHeaders,
      params: resolvedParams,
      body: resolvedBody,
      assertions: request.assertions,
    }),
  });

  const data = await response.json();
  if (data && data.response) {
    return data.response;
  }

  throw new Error(data.error || "Execution failed");
}
