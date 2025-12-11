-- Migration: Add batch_id to consumptions table
-- This allows grouping multiple consumptions validated together

-- Add batch_id column to consumptions table
ALTER TABLE public.consumptions 
ADD COLUMN IF NOT EXISTS batch_id uuid;

-- Create index for efficient batch queries
CREATE INDEX IF NOT EXISTS idx_consumptions_batch_id 
ON public.consumptions(batch_id);

-- Create index for user + batch_id queries
CREATE INDEX IF NOT EXISTS idx_consumptions_user_batch 
ON public.consumptions(user_id, batch_id);

-- Add comment
COMMENT ON COLUMN public.consumptions.batch_id IS 'UUID to group consumptions validated together in a single batch';
