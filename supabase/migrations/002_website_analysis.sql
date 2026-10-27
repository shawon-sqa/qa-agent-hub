-- ==============================================================================
-- QA Agent Hub - Migration 002: Website Analysis Schema
-- Created for: Shawon Ahmed (Lead QA Engineer)
-- Table: website_analyses
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.website_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    scan_duration_ms INTEGER DEFAULT 0,
    total_pages_scanned INTEGER DEFAULT 1,
    signals JSONB DEFAULT '{}'::jsonb,
    pages_inventory JSONB DEFAULT '[]'::jsonb,
    findings JSONB DEFAULT '[]'::jsonb,
    business_intelligence JSONB DEFAULT '{}'::jsonb,
    business_analysis_report JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_website_analyses_project_id ON public.website_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_website_analyses_created_at ON public.website_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_analyses_status ON public.website_analyses(status);

CREATE TRIGGER update_website_analyses_updated_at
    BEFORE UPDATE ON public.website_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.website_analyses ENABLE ROW LEVEL SECURITY;

-- Allow public read-write for development / authenticated users
CREATE POLICY "Allow public read-write for website_analyses" 
    ON public.website_analyses 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
