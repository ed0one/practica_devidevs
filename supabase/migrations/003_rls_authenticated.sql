-- Restricționează toate policies la rolul authenticated (nu public/anon)
drop policy if exists "Users see own tasks" on public.tasks;
drop policy if exists "Users insert own tasks" on public.tasks;
drop policy if exists "Users update own tasks" on public.tasks;
drop policy if exists "Users delete own tasks" on public.tasks;

create policy "Users see own tasks"
  on public.tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own tasks"
  on public.tasks for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own tasks"
  on public.tasks for delete
  to authenticated
  using (auth.uid() = user_id);
