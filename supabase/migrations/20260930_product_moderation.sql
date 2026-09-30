-- Flukeshop product review workflow.
-- After applying this migration, grant admin access to trusted account IDs only:
-- INSERT INTO public.flukeshop_admins (user_id) VALUES ('<auth.users UUID>');

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_moderation_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

CREATE TABLE IF NOT EXISTS public.flukeshop_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flukeshop_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_flukeshop_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flukeshop_admins a WHERE a.user_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.is_flukeshop_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_flukeshop_admin() TO authenticated;

CREATE POLICY "Admins can view own admin membership"
  ON public.flukeshop_admins FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.product_review_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_description text NOT NULL,
  evidence_url text,
  seller_declaration boolean NOT NULL DEFAULT false CHECK (seller_declaration),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_review_evidence ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.flukeshop_admins TO authenticated;
GRANT SELECT, INSERT ON public.product_review_evidence TO authenticated;

CREATE POLICY "Sellers can submit evidence for own products"
  ON public.product_review_evidence FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND seller_declaration = true
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.seller_id = (SELECT auth.uid())
        AND p.moderation_status = 'pending'
    )
  );
CREATE POLICY "Sellers and admins can view review evidence"
  ON public.product_review_evidence FOR SELECT TO authenticated
  USING (seller_id = (SELECT auth.uid()) OR (SELECT public.is_flukeshop_admin()));

-- Replace prior product policies so legacy permissive policies cannot expose pending items
-- or let a seller approve their own listing (Postgres combines permissive policies with OR).
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.products', policy_row.policyname);
  END LOOP;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (moderation_status = 'approved');
CREATE POLICY "Sellers can view own products"
  ON public.products FOR SELECT TO authenticated
  USING (seller_id = (SELECT auth.uid()));
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT TO authenticated
  USING ((SELECT public.is_flukeshop_admin()));
CREATE POLICY "Sellers can submit products for review"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (seller_id = (SELECT auth.uid()) AND moderation_status = 'pending');
CREATE POLICY "Admins can update product review status"
  ON public.products FOR UPDATE TO authenticated
  USING ((SELECT public.is_flukeshop_admin()))
  WITH CHECK ((SELECT public.is_flukeshop_admin()));
CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE TO authenticated
  USING (seller_id = (SELECT auth.uid()));
