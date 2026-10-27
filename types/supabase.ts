import type { TenSectionAnalysis, VerificationStatus } from "./website-analysis";

export type { TenSectionAnalysis, VerificationStatus };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessAnalysisReportJson = TenSectionAnalysis | Json;

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          domain: string | null;
          environment: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          domain?: string | null;
          environment?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          domain?: string | null;
          environment?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      requirements: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          raw_text: string;
          analysis: Json | null;
          risk_level: "low" | "medium" | "high" | "critical";
          status: "draft" | "analyzed" | "approved" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          raw_text: string;
          analysis?: Json | null;
          risk_level?: "low" | "medium" | "high" | "critical";
          status?: "draft" | "analyzed" | "approved" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          raw_text?: string;
          analysis?: Json | null;
          risk_level?: "low" | "medium" | "high" | "critical";
          status?: "draft" | "analyzed" | "approved" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      test_cases: {
        Row: {
          id: string;
          project_id: string;
          requirement_id: string | null;
          title: string;
          description: string | null;
          type: "e2e" | "api" | "unit" | "security" | "performance" | "manual";
          priority: "low" | "medium" | "high" | "critical";
          steps: Json;
          expected_result: string;
          status: "draft" | "active" | "passed" | "failed" | "skipped";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          requirement_id?: string | null;
          title: string;
          description?: string | null;
          type?: "e2e" | "api" | "unit" | "security" | "performance" | "manual";
          priority?: "low" | "medium" | "high" | "critical";
          steps?: Json;
          expected_result: string;
          status?: "draft" | "active" | "passed" | "failed" | "skipped";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          requirement_id?: string | null;
          title?: string;
          description?: string | null;
          type?: "e2e" | "api" | "unit" | "security" | "performance" | "manual";
          priority?: "low" | "medium" | "high" | "critical";
          steps?: Json;
          expected_result?: string;
          status?: "draft" | "active" | "passed" | "failed" | "skipped";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      test_runs: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          suite_name: string;
          environment: string;
          tester_name: string;
          status: "in_progress" | "completed" | "aborted";
          total_tests: number;
          passed_count: number;
          failed_count: number;
          blocked_count: number;
          not_run_count: number;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          suite_name?: string;
          environment?: string;
          tester_name?: string;
          status?: "in_progress" | "completed" | "aborted";
          total_tests?: number;
          passed_count?: number;
          failed_count?: number;
          blocked_count?: number;
          not_run_count?: number;
          started_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          suite_name?: string;
          environment?: string;
          tester_name?: string;
          status?: "in_progress" | "completed" | "aborted";
          total_tests?: number;
          passed_count?: number;
          failed_count?: number;
          blocked_count?: number;
          not_run_count?: number;
          started_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      test_results: {
        Row: {
          id: string;
          run_id: string;
          test_case_id: string | null;
          test_case_code: string;
          title: string;
          status: "passed" | "failed" | "blocked" | "not_run";
          steps_execution: Json;
          notes: string | null;
          evidence_urls: Json | null;
          execution_time_ms: number;
          executed_by: string;
          executed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          test_case_id?: string | null;
          test_case_code: string;
          title: string;
          status?: "passed" | "failed" | "blocked" | "not_run";
          steps_execution?: Json;
          notes?: string | null;
          evidence_urls?: Json | null;
          execution_time_ms?: number;
          executed_by?: string;
          executed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          test_case_id?: string | null;
          test_case_code?: string;
          title?: string;
          status?: "passed" | "failed" | "blocked" | "not_run";
          steps_execution?: Json;
          notes?: string | null;
          evidence_urls?: Json | null;
          execution_time_ms?: number;
          executed_by?: string;
          executed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bugs: {
        Row: {
          id: string;
          project_id: string;
          test_case_id: string | null;
          test_case_code?: string | null;
          run_id?: string | null;
          test_result_id?: string | null;
          title: string;
          description: string;
          severity: "low" | "medium" | "high" | "critical";
          priority: "low" | "medium" | "high" | "critical";
          status: "open" | "in_progress" | "resolved" | "closed";
          reproduction_steps: Json | null;
          expected_result?: string | null;
          actual_result?: string | null;
          environment?: string | null;
          reported_by?: string | null;
          assignee?: string | null;
          evidence_urls?: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          test_case_id?: string | null;
          test_case_code?: string | null;
          run_id?: string | null;
          test_result_id?: string | null;
          title: string;
          description: string;
          severity?: "low" | "medium" | "high" | "critical";
          priority?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          reproduction_steps?: Json | null;
          expected_result?: string | null;
          actual_result?: string | null;
          environment?: string | null;
          reported_by?: string | null;
          assignee?: string | null;
          evidence_urls?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          test_case_id?: string | null;
          test_case_code?: string | null;
          run_id?: string | null;
          test_result_id?: string | null;
          title?: string;
          description?: string;
          severity?: "low" | "medium" | "high" | "critical";
          priority?: "low" | "medium" | "high" | "critical";
          status?: "open" | "in_progress" | "resolved" | "closed";
          reproduction_steps?: Json | null;
          expected_result?: string | null;
          actual_result?: string | null;
          environment?: string | null;
          reported_by?: string | null;
          assignee?: string | null;
          evidence_urls?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_analyses: {
        Row: {
          id: string;
          project_id: string | null;
          target_url: string;
          domain: string;
          status: string;
          scan_duration_ms: number;
          total_pages_scanned: number;
          signals: Json;
          pages_inventory: Json;
          findings: Json;
          business_intelligence?: Json | null;
          ten_section_analysis?: Json | null;
          business_analysis_report?: TenSectionAnalysis | Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          target_url: string;
          domain: string;
          status?: string;
          scan_duration_ms?: number;
          total_pages_scanned?: number;
          signals?: Json;
          pages_inventory?: Json;
          findings?: Json;
          business_intelligence?: Json | null;
          ten_section_analysis?: Json | null;
          business_analysis_report?: TenSectionAnalysis | Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          target_url?: string;
          domain?: string;
          status?: string;
          scan_duration_ms?: number;
          total_pages_scanned?: number;
          signals?: Json;
          pages_inventory?: Json;
          findings?: Json;
          business_intelligence?: Json | null;
          ten_section_analysis?: Json | null;
          business_analysis_report?: TenSectionAnalysis | Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_flows: {
        Row: {
          id: string;
          project_id: string;
          flow_code: string;
          title: string;
          description: string | null;
          category: string;
          status: "draft" | "reviewed" | "approved" | "deprecated";
          start_point: string;
          end_point: string;
          steps: Json;
          validation: Json | null;
          traceability: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          flow_code: string;
          title: string;
          description?: string | null;
          category?: string;
          status?: "draft" | "reviewed" | "approved" | "deprecated";
          start_point: string;
          end_point: string;
          steps?: Json;
          validation?: Json | null;
          traceability?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          flow_code?: string;
          title?: string;
          description?: string | null;
          category?: string;
          status?: "draft" | "reviewed" | "approved" | "deprecated";
          start_point?: string;
          end_point?: string;
          steps?: Json;
          validation?: Json | null;
          traceability?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      security_scans: {
        Row: {
          id: string;
          project_id: string;
          target_url: string;
          overall_score: number;
          grade: string;
          scanned_by: string;
          scan_duration_ms: number;
          headers_checked: Json;
          vulnerabilities: Json;
          summary: Json;
          status: "completed" | "in_progress" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          target_url: string;
          overall_score?: number;
          grade?: string;
          scanned_by?: string;
          scan_duration_ms?: number;
          headers_checked?: Json;
          vulnerabilities?: Json;
          summary?: Json;
          status?: "completed" | "in_progress" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          target_url?: string;
          overall_score?: number;
          grade?: string;
          scanned_by?: string;
          scan_duration_ms?: number;
          headers_checked?: Json;
          vulnerabilities?: Json;
          summary?: Json;
          status?: "completed" | "in_progress" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      performance_scans: {
        Row: {
          id: string;
          project_id: string;
          target_url: string;
          tested_by: string;
          performance_score: number;
          latency_ms: number;
          payload_size_kb: number;
          web_vitals: Json;
          metrics: Json;
          score_breakdown: Json;
          k6_script: string | null;
          artillery_script: string | null;
          status: "completed" | "in_progress" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          target_url: string;
          tested_by?: string;
          performance_score?: number;
          latency_ms?: number;
          payload_size_kb?: number;
          web_vitals?: Json;
          metrics?: Json;
          score_breakdown?: Json;
          k6_script?: string | null;
          artillery_script?: string | null;
          status?: "completed" | "in_progress" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          target_url?: string;
          tested_by?: string;
          performance_score?: number;
          latency_ms?: number;
          payload_size_kb?: number;
          web_vitals?: Json;
          metrics?: Json;
          score_breakdown?: Json;
          k6_script?: string | null;
          artillery_script?: string | null;
          status?: "completed" | "in_progress" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
