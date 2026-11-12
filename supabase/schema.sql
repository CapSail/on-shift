-- ON SHIFT leaderboard schema (Supabase / Postgres). Run this once in the Supabase SQL editor.
--
-- Model: friends-only. Everyone signs in ANONYMOUSLY (no passwords, no e-mail), then joins the group with the
-- invite code and picks a display name. Nobody can write to a table directly; every write goes through a
-- SECURITY DEFINER function that checks membership and sanity-checks the numbers. Only members can read.
-- A lost phone just becomes a new player (matches "lose the device = start over").

create table if not exists app_config (key text primary key, value text not null);
-- CHANGE THIS invite code, then share it with your friends. Rotate it any time:  update app_config set value='NEW' where key='invite_code';
insert into app_config (key, value) values ('invite_code', 'CHANGE-ME-NIGHTSHIFT') on conflict (key) do nothing;

create table if not exists players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 20),
  created_at timestamptz not null default now()
);
create unique index if not exists players_name_ci on players (lower(name));

create table if not exists stats (
  player_id uuid primary key references players (id) on delete cascade,
  xp int not null default 0,
  xp_week int not null default 0,
  week_id int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  dex int not null default 0,
  calls int not null default 0,
  tp_caught int not null default 0,
  tp_total int not null default 0,
  fp_closed int not null default 0,
  fp_total int not null default 0,
  boss_wins int not null default 0,
  rank_idx int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists daily_results (
  player_id uuid not null references players (id) on delete cascade,
  day int not null,
  score int not null,
  n int not null,
  grid text not null,
  created_at timestamptz not null default now(),
  primary key (player_id, day)          -- first submission wins, no replays
);

alter table app_config enable row level security;       -- no policies: unreadable by clients
alter table players enable row level security;
alter table stats enable row level security;
alter table daily_results enable row level security;

create or replace function is_member() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from players where id = auth.uid()) $$;

drop policy if exists members_read_players on players;
create policy members_read_players on players for select to authenticated using (is_member());
drop policy if exists members_read_stats on stats;
create policy members_read_stats on stats for select to authenticated using (is_member());
drop policy if exists members_read_daily on daily_results;
create policy members_read_daily on daily_results for select to authenticated using (is_member());

-- join with the invite code and pick a name
create or replace function join_group(p_code text, p_name text) returns json
language plpgsql security definer set search_path = public
as $$
declare nm text := btrim(p_name);
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if lower(btrim(p_code)) <> lower((select value from app_config where key = 'invite_code')) then raise exception 'wrong invite code'; end if;
  if char_length(nm) < 2 or char_length(nm) > 20 then raise exception 'name must be 2-20 characters'; end if;
  begin
    insert into players (id, name) values (auth.uid(), nm)
      on conflict (id) do update set name = excluded.name;
  exception when unique_violation then raise exception 'name taken';
  end;
  insert into stats (player_id) values (auth.uid()) on conflict do nothing;
  return json_build_object('ok', true, 'name', nm);
end $$;

create or replace function set_name(p_name text) returns json
language plpgsql security definer set search_path = public
as $$
declare nm text := btrim(p_name);
begin
  if not is_member() then raise exception 'not a member'; end if;
  if char_length(nm) < 2 or char_length(nm) > 20 then raise exception 'name must be 2-20 characters'; end if;
  begin
    update players set name = nm where id = auth.uid();
  exception when unique_violation then raise exception 'name taken';
  end;
  return json_build_object('ok', true, 'name', nm);
end $$;

-- push my stats (a snapshot; the app sends it whenever it is online)
create or replace function submit_stats(p jsonb) returns json
language plpgsql security definer set search_path = public
as $$
declare
  g constant int := 100000;
  v_calls int := least(greatest(coalesce((p->>'calls')::int, 0), 0), g);
  v_tpc int := least(greatest(coalesce((p->>'tp_caught')::int, 0), 0), g);
  v_tpt int := least(greatest(coalesce((p->>'tp_total')::int, 0), 0), g);
  v_fpc int := least(greatest(coalesce((p->>'fp_closed')::int, 0), 0), g);
  v_fpt int := least(greatest(coalesce((p->>'fp_total')::int, 0), 0), g);
begin
  if not is_member() then raise exception 'not a member'; end if;
  if v_tpc > v_tpt or v_fpc > v_fpt or v_tpt + v_fpt > v_calls + 5 then raise exception 'implausible stats'; end if;
  insert into stats (player_id, xp, xp_week, week_id, streak, best_streak, dex, calls, tp_caught, tp_total, fp_closed, fp_total, boss_wins, rank_idx, updated_at)
  values (auth.uid(),
    least(greatest(coalesce((p->>'xp')::int, 0), 0), 1000000),
    least(greatest(coalesce((p->>'xp_week')::int, 0), 0), 100000),
    coalesce((p->>'week_id')::int, 0),
    least(greatest(coalesce((p->>'streak')::int, 0), 0), 5000),
    least(greatest(coalesce((p->>'best_streak')::int, 0), 0), 5000),
    least(greatest(coalesce((p->>'dex')::int, 0), 0), 400),
    v_calls, v_tpc, v_tpt, v_fpc, v_fpt,
    least(greatest(coalesce((p->>'boss_wins')::int, 0), 0), 1000),
    least(greatest(coalesce((p->>'rank_idx')::int, 0), 0), 20),
    now())
  on conflict (player_id) do update set
    xp = excluded.xp, xp_week = excluded.xp_week, week_id = excluded.week_id, streak = excluded.streak,
    best_streak = excluded.best_streak, dex = excluded.dex, calls = excluded.calls, tp_caught = excluded.tp_caught,
    tp_total = excluded.tp_total, fp_closed = excluded.fp_closed, fp_total = excluded.fp_total,
    boss_wins = excluded.boss_wins, rank_idx = excluded.rank_idx, updated_at = now();
  return json_build_object('ok', true);
end $$;

-- one daily result per player per day; the first submission wins
create or replace function submit_daily(p_day int, p_score int, p_n int, p_grid text) returns json
language plpgsql security definer set search_path = public
as $$
begin
  if not is_member() then raise exception 'not a member'; end if;
  if p_n < 1 or p_n > 12 or p_score < 0 or p_score > p_n or char_length(p_grid) > 80 then raise exception 'implausible result'; end if;
  insert into daily_results (player_id, day, score, n, grid) values (auth.uid(), p_day, p_score, p_n, p_grid) on conflict do nothing;
  return json_build_object('ok', true);
end $$;

-- the whole roster, including friends who have not played yet, plus today's daily result
create or replace function roster(p_day int) returns table (
  name text, me boolean, xp int, xp_week int, week_id int, streak int, best_streak int, dex int, calls int,
  tp_caught int, tp_total int, fp_closed int, fp_total int, boss_wins int, rank_idx int, updated_at timestamptz,
  daily_score int, daily_n int, daily_grid text)
language sql security definer set search_path = public stable
as $$
  select p.name, p.id = auth.uid(), coalesce(s.xp, 0), coalesce(s.xp_week, 0), coalesce(s.week_id, 0), coalesce(s.streak, 0),
         coalesce(s.best_streak, 0), coalesce(s.dex, 0), coalesce(s.calls, 0), coalesce(s.tp_caught, 0), coalesce(s.tp_total, 0),
         coalesce(s.fp_closed, 0), coalesce(s.fp_total, 0), coalesce(s.boss_wins, 0), coalesce(s.rank_idx, 0), s.updated_at,
         d.score, d.n, d.grid
  from players p
  left join stats s on s.player_id = p.id
  left join daily_results d on d.player_id = p.id and d.day = p_day
  where is_member()
  order by p.name
$$;

revoke all on function join_group(text, text), set_name(text), submit_stats(jsonb), submit_daily(int, int, int, text), roster(int) from public, anon;
grant execute on function join_group(text, text), set_name(text), submit_stats(jsonb), submit_daily(int, int, int, text), roster(int) to authenticated;
