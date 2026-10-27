-- ==============================================================================
-- QA Agent Hub - Migration 003: Add business_analysis_report to website_analyses
-- Created for: Shawon Ahmed (Lead QA Engineer)
-- ==============================================================================

ALTER TABLE public.website_analyses
ADD COLUMN IF NOT EXISTS business_intelligence JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_analysis_report JSONB DEFAULT '{}'::jsonb;
