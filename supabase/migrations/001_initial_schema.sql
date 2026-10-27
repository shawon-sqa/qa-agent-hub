-- ==============================================================================
-- QA Agent Hub - Migration 001: Initial Core Schema
-- Created for: Shawon Ahmed (Lead QA Engineer)
-- Tables: projects, requirements, test_cases, bugs
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLE: projects
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    domain TEXT,
    environment TEXT NOT NULL DEFAULT 'Production',
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLE: requirements
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    analysis JSONB DEFAULT '{}'::jsonb,
    risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'approved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON public.requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON public.requirements(status);

CREATE TRIGGER update_requirements_updated_at
    BEFORE UPDATE ON public.requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLE: test_cases
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'e2e' CHECK (type IN ('e2e', 'api', 'unit', 'security', 'performance', 'manual')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    expected_result TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'failed', 'skipped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON public.test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_requirement_id ON public.test_cases(requirement_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON public.test_cases(status);

CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON public.test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLE: bugs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    reproduction_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON public.bugs(project_id);
CREATE INDEX IF NOT EXISTS idx_bugs_test_case_id ON public.bugs(test_case_id);
CREATE INDEX IF NOT EXISTS idx_bugs_severity ON public.bugs(severity);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON public.bugs(status);

CREATE TRIGGER update_bugs_updated_at
    BEFORE UPDATE ON public.bugs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;

-- Development policy: allow full access for authenticated and anonymous users with project anon key
CREATE POLICY "Allow public read-write for projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for requirements" ON public.requirements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for test_cases" ON public.test_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for bugs" ON public.bugs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Initial Seed Data
-- ==============================================================================
INSERT INTO public.projects (id, name, description, domain, environment, status)
VALUES
    ('c4b14d23-26a0-4cf8-8316-2c5e53303da1', 'FinTech Banking Portal', 'Retail customer banking and transaction processing app', 'app.securebank.com', 'Production', 'Active'),
    ('d7a98e54-52d3-46ea-9d6f-782d1c6e11f2', 'E-Commerce Checkout Flow', 'Storefront cart, checkout, payment gateway, and promotion engine', 'shop.luxwear.store', 'Staging', 'Active'),
    ('e9c32a11-89fc-482a-b673-984210bc6a99', 'Healthcare Provider Portal', 'HIPAA compliant patient telemetry and physician portal', 'portal.carepulse.org', 'Production', 'Active')
ON CONFLICT (id) DO NOTHING;
