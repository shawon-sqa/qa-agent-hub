import { NextRequest, NextResponse } from "next/server";

interface AnalyzeRequirementRequest {
  requirementText: string;
  projectId?: string;
  title?: string;
}

interface AnalysisResult {
  title: string;
  summary: string;
  riskAssessment: {
    level: "low" | "medium" | "high" | "critical";
    score: number;
    factors: string[];
  };
  features: Array<{
    name: string;
    description: string;
    acceptanceCriteria: string[];
  }>;
  testScenarios: Array<{
    title: string;
    type: "e2e" | "api" | "security" | "performance" | "unit";
    priority: "low" | "medium" | "high" | "critical";
    steps: string[];
    expectedResult: string;
  }>;
  edgeCases: string[];
  securityConsiderations: string[];
  isMock?: boolean;
  notice?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequirementRequest;
    const { requirementText, projectId, title } = body;

    // 1. Validation
    if (!requirementText || typeof requirementText !== "string" || !requirementText.trim()) {
      return NextResponse.json(
        { error: "Invalid input: 'requirementText' string is required." },
        { status: 400 }
      );
    }

    if (requirementText.length > 25000) {
      return NextResponse.json(
        { error: "Input exceeds maximum limit of 25,000 characters." },
        { status: 400 }
      );
    }

    // 2. Secure Server-Side Gemini API Key check
    const apiKey = process.env.GEMINI_API_KEY;

    // Safe fallback if key is unconfigured or default placeholder
    if (!apiKey || apiKey === "your_gemini_api_key") {
      const mockResult: AnalysisResult = generateMockAnalysis(requirementText, title);
      return NextResponse.json(mockResult, { status: 200 });
    }

    // 3. Connect to Gemini API (REST Endpoint)
    const prompt = `
You are an expert QA Architect and Test Automation Lead analyzing a software requirement for Shawon Ahmed's QA Agent Hub.
Analyze the following requirement specification and produce a rigorous QA breakdown in JSON format.

Requirement:
"""
${requirementText}
"""

You MUST respond strictly with valid JSON conforming to the following structure:
{
  "title": "Concise requirement title",
  "summary": "Executive summary of the requirement",
  "riskAssessment": {
    "level": "low" | "medium" | "high" | "critical",
    "score": 0-100,
    "factors": ["risk factor 1", "risk factor 2"]
  },
  "features": [
    {
      "name": "Feature Name",
      "description": "Functional description",
      "acceptanceCriteria": ["AC 1", "AC 2"]
    }
  ],
  "testScenarios": [
    {
      "title": "Test Scenario Title",
      "type": "e2e" | "api" | "security" | "performance" | "unit",
      "priority": "low" | "medium" | "high" | "critical",
      "steps": ["Step 1", "Step 2"],
      "expectedResult": "Expected outcome"
    }
  ],
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "securityConsiderations": ["Security consideration 1", "Security consideration 2"]
}
`;

    // Try Gemini 2.5 Flash / 1.5 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("[Gemini API Error]", geminiResponse.status, errText);
      
      // Fallback to mock analysis if quota/endpoint fails so UX is not blocked
      const fallback = generateMockAnalysis(requirementText, title);
      fallback.notice = `Gemini API returned status ${geminiResponse.status}. Served high-fidelity fallback analysis.`;
      return NextResponse.json(fallback, { status: 200 });
    }

    const data = await geminiResponse.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("No text content returned from Gemini model.");
    }

    const parsedAnalysis = JSON.parse(candidateText) as AnalysisResult;

    return NextResponse.json(
      {
        ...parsedAnalysis,
        projectId: projectId || null,
        analyzedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[analyze-requirement error]:", message);
    return NextResponse.json(
      { error: "Failed to analyze requirement", details: message },
      { status: 500 }
    );
  }
}

/**
 * High-fidelity fallback analyzer for testing and development environments
 */
function generateMockAnalysis(rawText: string, customTitle?: string): AnalysisResult {
  const shortText = rawText.slice(0, 150).trim();
  const title = customTitle || "Authentication & Payment Processing Workflow";

  return {
    title,
    summary: `Structured QA specification extracted from input: "${shortText}..."`,
    riskAssessment: {
      level: "medium",
      score: 65,
      factors: [
        "Multiple external third-party API dependencies",
        "Sensitive user data transmission and storage",
        "Potential concurrency edge cases during high load",
      ],
    },
    features: [
      {
        name: "Core Workflow Execution",
        description: "Primary user interaction flow adhering to standard business criteria",
        acceptanceCriteria: [
          "Input data must be sanitized and validated client & server side",
          "Success response returns HTTP 200 with transaction metadata",
          "Failures must trigger deterministic error states with descriptive UI feedback",
        ],
      },
      {
        name: "Error Handling & Fallback Strategy",
        description: "Graceful degradation when upstream services experience latency or failures",
        acceptanceCriteria: [
          "Retries up to 3 times on network timeout with exponential backoff",
          "Audit event is dispatched to security telemetry stream",
        ],
      },
    ],
    testScenarios: [
      {
        title: "Happy Path End-to-End Execution",
        type: "e2e",
        priority: "critical",
        steps: [
          "Navigate to target URL and authenticate as test user",
          "Populate required input fields with valid test fixtures",
          "Submit form and assert successful confirmation toast",
        ],
        expectedResult: "User receives successful state confirmation and database record is created.",
      },
      {
        title: "API Schema and Validation Boundary Check",
        type: "api",
        priority: "high",
        steps: [
          "Dispatch POST request with empty payload",
          "Dispatch POST request with malicious script injection characters",
        ],
        expectedResult: "Server responds with HTTP 400 Bad Request and zero database mutations.",
      },
      {
        title: "Security Header and Token Expiry Validation",
        type: "security",
        priority: "high",
        steps: [
          "Inspect HTTP response headers for Content-Security-Policy and X-Frame-Options",
          "Attempt action with expired bearer token",
        ],
        expectedResult: "Request is rejected with HTTP 401 Unauthorized.",
      },
    ],
    edgeCases: [
      "Rapid double-clicking on submit button resulting in duplicate database entries",
      "Network disconnection while payment transaction is in 'pending' state",
      "Special characters in user-submitted string fields (Unicode, emojis, long strings)",
    ],
    securityConsiderations: [
      "Ensure API keys and bearer tokens are never logged in plain text",
      "Validate CORS origins on all POST and PUT endpoints",
      "Enforce strict rate limiting per IP / user token to prevent brute force attacks",
    ],
    isMock: true,
    notice:
      "Note: Using simulation analysis because GEMINI_API_KEY in .env.local is currently a placeholder. Add your live Gemini API key to .env.local to enable real-time inference.",
  };
}
