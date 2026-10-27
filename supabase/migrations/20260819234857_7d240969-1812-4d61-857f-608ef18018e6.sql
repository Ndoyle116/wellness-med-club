UPDATE public.product_approvals
   SET status = 'pending',
       reviewed_by = NULL,
       reviewed_at = NULL,
       reason = NULL,
       updated_at = now()
 WHERE id IN ('dfdfcda3-1981-488d-93e4-9caab3d996cf','307010a3-9ead-481a-b6ed-72f71a4e6121');