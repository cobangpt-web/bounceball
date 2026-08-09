create table if not exists public.bounce_up_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  level_index integer not null check (level_index between 0 and 4),
  player_name text not null default '익명',
  time double precision not null check (time > 0 and time < 600),
  stars integer not null check (stars between 0 and 3),
  replay jsonb not null
);

create index if not exists bounce_up_runs_rank_idx
  on public.bounce_up_runs (level_index, stars desc, time asc, created_at asc);

alter table public.bounce_up_runs enable row level security;

drop policy if exists "Anyone can read bounce rankings" on public.bounce_up_runs;
create policy "Anyone can read bounce rankings"
  on public.bounce_up_runs
  for select
  using (true);

drop policy if exists "Anyone can submit bounce runs" on public.bounce_up_runs;
create policy "Anyone can submit bounce runs"
  on public.bounce_up_runs
  for insert
  with check (
    jsonb_typeof(replay) = 'object'
    and jsonb_array_length(replay->'samples') between 2 and 1500
  );
