create table public.tasks (
  id integer primary key,
  title text not null,
  status text not null default 'todo' check (status in ('todo','active','done')),
  since timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.tasks to anon, authenticated;
grant all on public.tasks to service_role;

alter table public.tasks enable row level security;

create policy "Anyone can read tasks" on public.tasks for select to anon, authenticated using (true);
create policy "Anyone can insert tasks" on public.tasks for insert to anon, authenticated with check (true);
create policy "Anyone can update tasks" on public.tasks for update to anon, authenticated using (true) with check (true);
create policy "Anyone can delete tasks" on public.tasks for delete to anon, authenticated using (true);

alter publication supabase_realtime add table public.tasks;

insert into public.tasks (id, title, status, since) values
  (1, 'Ship onboarding flow', 'active', now() - interval '14 minutes 32 seconds'),
  (2, 'Draft Q3 roadmap', 'todo', null),
  (3, 'Review PR #248', 'todo', null),
  (4, 'Fix login bug', 'done', null),
  (5, 'Update docs', 'done', null);
