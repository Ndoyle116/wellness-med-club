
ALTER TABLE public.product_approvals
  ADD COLUMN IF NOT EXISTS document_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resubmitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS previous_reason text;

CREATE INDEX IF NOT EXISTS product_approvals_resubmitted_idx
  ON public.product_approvals (resubmitted_at)
  WHERE resubmitted_at IS NOT NULL;
