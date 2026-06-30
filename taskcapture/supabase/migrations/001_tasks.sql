CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  deadline timestamptz,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  category text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  raw_input text,
  created_at timestamptz NOT NULL DEFAULT now(),
  scheduled_date date,
  scheduled_start timestamptz,
  scheduled_end timestamptz
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
