-- ==============================================================================
-- MIGRATION 005: Manual QA Execution & Defect Management (Bug Reports)
-- ==============================================================================

-- 1. Table: test_runs
CREATE TABLE IF NOT EXISTS public.test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    suite_name TEXT NOT NULL DEFAULT 'All Test Suites',
    environment TEXT NOT NULL DEFAULT 'Staging',
    tester_name TEXT NOT NULL DEFAULT 'Shawon Ahmed',
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'aborted')),
    total_tests INTEGER NOT NULL DEFAULT 0,
    passed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    blocked_count INTEGER NOT NULL DEFAULT 0,
    not_run_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_test_runs_project_id ON public.test_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON public.test_runs(status);

-- 2. Table: test_results (preserves step-by-step history per run)
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
    test_case_code TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_run' CHECK (status IN ('passed', 'failed', 'blocked', 'not_run')),
    steps_execution JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    execution_time_ms INTEGER DEFAULT 0,
    executed_by TEXT NOT NULL DEFAULT 'Shawon Ahmed',
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON public.test_results(run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON public.test_results(status);

-- 3. Enhance public.bugs with optional defect tracking columns
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.test_runs(id) ON DELETE SET NULL;
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS test_result_id UUID REFERENCES public.test_results(id) ON DELETE SET NULL;
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS reported_by TEXT NOT NULL DEFAULT 'Shawon Ahmed';
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS assignee TEXT NOT NULL DEFAULT 'Unassigned';
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS evidence_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS actual_result TEXT;
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS expected_result TEXT;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for test_runs" ON public.test_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for test_results" ON public.test_results FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed Initial Test Runs & Results for Default Projects
INSERT INTO public.test_runs (id, project_id, name, suite_name, environment, tester_name, status, total_tests, passed_count, failed_count, blocked_count, not_run_count, started_at)
VALUES
    (
        'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        'c4b14d23-26a0-4cf8-8316-2c5e53303da1',
        'Sprint 14 Manual Regression - Banking Flow',
        'Core Banking & Fund Transfer',
        'Staging',
        'Shawon Ahmed',
        'in_progress',
        6,
        3,
        1,
        1,
        1,
        NOW() - INTERVAL '2 hours'
    ),
    (
        'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        'd7a98e54-52d3-46ea-9d6f-782d1c6e11f2',
        'Storefront Cart & Payment Gateways Manual Audit',
        'Checkout & Payment Gateway',
        'Staging',
        'Shawon Ahmed',
        'in_progress',
        5,
        3,
        1,
        0,
        1,
        NOW() - INTERVAL '4 hours'
    )
ON CONFLICT (id) DO NOTHING;
