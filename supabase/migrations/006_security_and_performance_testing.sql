-- ==============================================================================
-- MIGRATION 006: Security Testing & Performance Testing Modules
-- Created for: Shawon Ahmed (Lead QA Engineer)
-- Tables: security_scans, performance_scans
-- ==============================================================================

-- 1. Table: security_scans
CREATE TABLE IF NOT EXISTS public.security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    target_url TEXT NOT NULL,
    overall_score INTEGER NOT NULL DEFAULT 0,
    grade TEXT NOT NULL DEFAULT 'B',
    scanned_by TEXT NOT NULL DEFAULT 'Shawon Ahmed',
    scan_duration_ms INTEGER NOT NULL DEFAULT 0,
    headers_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
    vulnerabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_security_scans_project_id ON public.security_scans(project_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_created_at ON public.security_scans(created_at DESC);

-- 2. Table: performance_scans
CREATE TABLE IF NOT EXISTS public.performance_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    target_url TEXT NOT NULL,
    tested_by TEXT NOT NULL DEFAULT 'Shawon Ahmed',
    performance_score INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    payload_size_kb NUMERIC(10, 2) NOT NULL DEFAULT 0,
    web_vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    k6_script TEXT,
    artillery_script TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_performance_scans_project_id ON public.performance_scans(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_scans_created_at ON public.performance_scans(created_at DESC);
