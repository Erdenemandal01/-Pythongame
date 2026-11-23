begin;

create table pq_private.score_ledger (
    user_id uuid not null references pq_private.player_accounts(user_id) on delete cascade,
    milestone text not null,
    xp smallint not null,
    earned_on date,
    primary key (user_id, milestone),
    check ((xp = 0 and earned_on is null) or (xp > 0 and earned_on is not null))
);
create index score_ledger_period on pq_private.score_ledger(earned_on, user_id) include (xp)
    where earned_on is not null;

create table pq_private.score_participants (
    user_id uuid primary key references pq_private.player_accounts(user_id) on delete cascade,
    alias text not null unique,
    joined boolean not null
);
alter table pq_private.score_ledger enable row level security;
alter table pq_private.score_participants enable row level security;
revoke all on pq_private.score_ledger, pq_private.score_participants from public, anon, authenticated;

-- Game saves provide completion flags. Points and award dates are assigned here.
create function pq_private.score_milestones(progress jsonb)
returns table(milestone text, points smallint, imported boolean)
language plpgsql immutable set search_path = '' as $$
declare
    n integer;
    battle_rewards smallint[] := array[100,140,170,200,250];
    handled jsonb := progress #> '{academy,importedForRanking}';
    garden_wins jsonb := progress #> '{academy,workshops,greenhouse,won}';
    task text;
begin
    imported := false;
    -- The adventure and battle campaigns unlock in order.
    for n in 0..29 loop
        exit when not coalesce((progress -> 'done') @> jsonb_build_array(n), false);
        milestone := 'mission:' || n;
        points := case when (n+1)%6 = 0 then 200 else 100 end;
        return next;
    end loop;
    for n in 0..4 loop
        exit when not coalesce((progress #> '{battles,won}') @> jsonb_build_array(n), false);
        milestone := 'battle:' || n;
        points := battle_rewards[n+1];
        return next;
    end loop;
    -- Studio lessons can be taken in any order; the saved lesson record must also exist.
    for n in 0..65 loop
        if (progress #> '{academy,won}') @> jsonb_build_array(n)
            and jsonb_typeof(progress #> array['academy','lessons',n::text]) = 'object' then
            milestone := 'academy:' || n;
            points := 150;
            imported := coalesce((handled -> 'lessons') @> jsonb_build_array(n), false);
            return next;
        end if;
    end loop;
    foreach task in array array['first', 'five'] loop
        exit when not coalesce(garden_wins @> jsonb_build_array(task), false);
        milestone := 'greenhouse:' || task;
        points := case task when 'first' then 50 else 100 end;
        imported := coalesce((handled -> 'greenhouse') @> jsonb_build_array(task), false);
        return next;
    end loop;
end;
$$;

create function pq_private.score_local_day(instant timestamptz) returns date
language sql immutable set search_path = '' as $$
    select (instant at time zone 'Asia/Ulaanbaatar')::date;
$$;

create function pq_private.record_score() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
    local_day date := pq_private.score_local_day(statement_timestamp());
begin
    if tg_op = 'UPDATE' and (new.save->'done') is not distinct from (old.save->'done')
        and (new.save#>'{battles,won}') is not distinct from (old.save#>'{battles,won}')
        and (new.save#>'{academy,won}') is not distinct from (old.save#>'{academy,won}')
        and (new.save#>'{academy,workshops,greenhouse,won}') is not distinct from
            (old.save#>'{academy,workshops,greenhouse,won}') then
        return null;
    end if;
    insert into pq_private.score_ledger(user_id, milestone, xp, earned_on)
    select new.user_id, m.milestone,
        case when tg_op = 'INSERT' or m.imported then 0 else m.points end,
        case when tg_op = 'INSERT' or m.imported then null else local_day end
    from pq_private.score_milestones(new.save) m
    on conflict (user_id, milestone) do nothing;
    return null;
end;
$$;

create trigger record_completed_milestones after insert or update of save
on pq_private.player_accounts for each row execute function pq_private.record_score();
-- Remember pre-rollout completions so an old save, replay or later edit cannot earn them again.
insert into pq_private.score_ledger(user_id,milestone,xp,earned_on)
select p.user_id, m.milestone, 0, null from pq_private.player_accounts p
cross join lateral pq_private.score_milestones(p.save) m;

create function pq_private.leaderboard(p_period text, p_join boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    uid uuid := auth.uid();
    local_day date := pq_private.score_local_day(statement_timestamp());
    period_start date;
    entry pq_private.score_participants%rowtype;
    candidate text;
    names text[] := array['Хээрийн үнэг','Талын бүргэд','Говийн хулан','Алтайн янгир','Ойн хэрэм','Хангайн буга'];
    top_rows jsonb;
    own_row jsonb;
begin
    if uid is null then raise sqlstate 'PT401' using message = 'sign_in_required'; end if;
    if not exists (select 1 from pq_private.player_accounts where user_id = uid) then
        raise sqlstate 'PT404' using message = 'profile_required';
    end if;
    case p_period
        when 'day' then period_start := local_day;
        when 'month' then period_start := date_trunc('month',local_day::timestamp)::date;
        else raise sqlstate 'PT422' using message = 'invalid_period';
    end case;

    if p_join is true then
        -- Joining again keeps the same alias. A collision on the short random suffix gets a fresh draw.
        loop
            candidate := names[1+floor(random()*array_length(names,1))::integer]
                || ' · ' || upper(left(gen_random_uuid()::text,8));
            begin
                insert into pq_private.score_participants as s (user_id,alias,joined)
                values (uid,candidate,true)
                on conflict (user_id) do update set joined = true;
                exit;
            exception when unique_violation then null;
            end;
        end loop;
    elsif p_join is false then
        update pq_private.score_participants set joined = false where user_id = uid and joined;
    end if;
    select * into entry from pq_private.score_participants where user_id = uid;
    with totals as (
        select p.alias, p.user_id = uid as me, sum(s.xp) as xp, count(*) as activities
        from pq_private.score_ledger s
        join pq_private.score_participants p using(user_id)
        where p.joined and s.earned_on between period_start and local_day
        group by p.user_id,p.alias
    ), ranked as (
        select rank() over(order by xp desc) as rank, alias,xp,activities,me from totals
    )
    select coalesce((select jsonb_agg(to_jsonb(t) order by t.rank,t.alias)
                     from (select * from ranked order by rank,alias limit 10) t),'[]'::jsonb),
           (select to_jsonb(r) from ranked r where r.me)
    into top_rows,own_row;
    return jsonb_build_object('joined',coalesce(entry.joined,false),
        'alias',case when entry.joined then entry.alias else null end,'rows',top_rows,'self',own_row);
end;
$$;

create function public.pq_leaderboard(p_period text, p_join boolean default null) returns jsonb
language sql security invoker set search_path = '' as $$
    select pq_private.leaderboard(p_period,p_join);
$$;
revoke all on function pq_private.score_milestones(jsonb),pq_private.score_local_day(timestamptz),
    pq_private.record_score(),pq_private.leaderboard(text,boolean),public.pq_leaderboard(text,boolean)
    from public,anon,authenticated;
grant execute on function pq_private.leaderboard(text,boolean),public.pq_leaderboard(text,boolean)
    to authenticated;

commit;
