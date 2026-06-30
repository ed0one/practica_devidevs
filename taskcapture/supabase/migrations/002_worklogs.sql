CREATE TABLE IF NOT EXISTS public.worklogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_spent integer NOT NULL,
  description text,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worklogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own worklogs" ON public.worklogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own worklogs" ON public.worklogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own worklogs" ON public.worklogs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_worklogs_task_id ON public.worklogs(task_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_user_id ON public.worklogs(user_id);
