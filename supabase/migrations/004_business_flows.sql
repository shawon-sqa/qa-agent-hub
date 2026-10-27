-- ==============================================================================
-- QA Agent Hub - Migration 004: Business Flows Schema
-- Created for: Shawon Ahmed (Lead QA Engineer)
-- Table: business_flows
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.business_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    flow_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'User Journey',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'deprecated')),
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation JSONB DEFAULT '{}'::jsonb,
    traceability JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_business_flows_project_id ON public.business_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_business_flows_status ON public.business_flows(status);
CREATE INDEX IF NOT EXISTS idx_business_flows_flow_code ON public.business_flows(flow_code);

CREATE TRIGGER update_business_flows_updated_at
    BEFORE UPDATE ON public.business_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
