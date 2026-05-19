CREATE TABLE public.rest_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rest_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rest_days TO service_role;

ALTER TABLE public.rest_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rest days"
ON public.rest_days FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rest days"
ON public.rest_days FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rest days"
ON public.rest_days FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rest days"
ON public.rest_days FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_rest_days_user_date ON public.rest_days(user_id, date DESC);