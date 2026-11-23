-- Run after the migrations on a disposable Supabase database with psql -v ON_ERROR_STOP=1.
begin;
insert into auth.users(id) values ('00000000-1100-4000-9999-000000000001'),('00000000-1100-4000-9999-000000000002');
set local role anon;
do $$ begin
    perform public.pq_leaderboard('day');
    raise exception 'Guest could read ranked players';
exception when insufficient_privilege then null; end $$;
reset role;
set local role authenticated;
do $$
declare
    alice uuid := '00000000-1100-4000-9999-000000000001';
    bob uuid := '00000000-1100-4000-9999-000000000002';
    akey text; bkey text; a_alias text; board jsonb; info jsonb; stored jsonb;
    initial json := '{"version":1,"done":[0],"academy":{"won":[4],"lessons":{"4":{}}}}';
    played jsonb := '{"version":1,"done":[0,1,1,29],"battles":{"won":[0,3,0]},
      "academy":{"won":[4,5,6,66,23],"lessons":{"4":{},"5":{},"6":{}},
      "workshops":{"greenhouse":{"won":["first","five","friend"]}},
      "importedForRanking":{"lessons":[6],"greenhouse":["five"]}}}';
begin
    perform set_config('request.jwt.claim.sub', alice::text, true);
    info := public.pq_account('account');
    akey := public.pq_account('register',json_build_object('name','Туршигч нэг','avatar','mage','save',initial),info->>'contextKey')->>'accountKey';
    board := public.pq_leaderboard('day');
    assert board = '{"joined":false,"alias":null,"rows":[],"self":null}'::jsonb;
    board := public.pq_leaderboard('day',true); a_alias := board->>'alias';
    assert a_alias <> '' and board->'rows' = '[]'::jsonb;
    perform public.pq_account('write_save',json_build_object('revision',1,'save',played),akey);
    board := public.pq_leaderboard('day');
    assert board->'self' = jsonb_build_object('rank',1,'xp',400,'activities',4,'alias',a_alias,'me',true);
    assert board -> 'rows' -> 0 = board -> 'self';
    assert board::text not like '%Туршигч%' and board::text not like '%'||alice::text||'%';
    -- Repeated saves, regressions and removal of import markers cannot earn the same milestones again.
    perform public.pq_account('write_save',json_build_object('revision',2,'save',initial),akey);
    stored := played #- '{academy,importedForRanking}';
    perform public.pq_account('write_save',json_build_object('revision',3,'save',stored),akey);
    assert (public.pq_leaderboard('month')->'self'->>'xp')::integer = 400;
    begin
        perform public.pq_account('write_save',json_build_object('revision',1,'save',jsonb_set(stored,'{done}','[0,1,2]')),akey);
        raise exception 'stale save accepted';
    exception when sqlstate 'PT409' then null; end;
    assert (public.pq_leaderboard('month')->'self'->>'xp')::integer = 400;
    begin
        perform public.pq_account('write_save',json_build_object('revision',4,'save',jsonb_set(stored,'{done}','[0,1,2]')),akey);
        raise exception 'simulate rolled-back request';
    exception when raise_exception then null; end;
    assert (public.pq_leaderboard('month')->'self'->>'xp')::integer = 400;

    perform set_config('request.jwt.claim.sub',bob::text,true);
    info := public.pq_account('account');
    bkey := public.pq_account('register',json_build_object('name','Туршигч хоёр','avatar','scout'),info->>'contextKey')->>'accountKey';
    perform public.pq_account('write_save','{"revision":0,"save":{"version":1,"done":[0,1,2,3]}}',bkey);
    assert jsonb_array_length(public.pq_leaderboard('day')->'rows')=1;
    board := public.pq_leaderboard('day',true);
    assert (board->'self'->>'rank')='1' and (board->'rows'->1->>'rank')='1';
    assert board->>'alias' <> a_alias and jsonb_array_length(board->'rows')=2;
    board := public.pq_leaderboard('day',false);
    assert board->'alias' = 'null' and board->'self' = 'null' and jsonb_array_length(board->'rows')=1;
    begin
        perform public.pq_leaderboard('week');
        raise exception 'unsupported period';
    exception when sqlstate 'PT422' then null; end;
    begin
        update pq_private.score_ledger set xp = 999;
        raise exception 'client could edit scores';
    exception when insufficient_privilege then null; end;
    begin
        insert into pq_private.score_participants values(bob,'Custom identity',true);
        raise exception 'client could set alias directly';
    exception when insufficient_privilege then null; end;
end; $$;
reset role;
do $$
declare
    alice uuid := '00000000-1100-4000-9999-000000000001';
    day_now date := pq_private.score_local_day(statement_timestamp());
    month_start date := date_trunc('month',day_now::timestamp)::date;
    player uuid; n integer; board jsonb;
begin
    assert pq_private.score_local_day(timestamptz '2026-11-30 15:59:59.999+00')=date '2026-11-30';
    assert pq_private.score_local_day(timestamptz '2026-11-30 16:00:00+00')=date '2026-12-01';
    assert (select count(*) from pq_private.score_ledger where user_id=alice and xp=0 and earned_on is null)=4;
    -- Exercise the same read path at month and day boundaries without changing system time.
    update pq_private.score_ledger set earned_on=month_start-1 where user_id=alice and milestone='battle:0';
    update pq_private.score_ledger set earned_on=month_start where user_id=alice and milestone='academy:5';
    perform set_config('request.jwt.claim.sub',alice::text,true);
    board:=public.pq_leaderboard('day');
    assert (board->'self'->>'xp')::integer = (case when day_now=month_start then 300 else 150 end);
    assert (public.pq_leaderboard('month')->'self'->>'xp')::integer=300;
    for n in 1..10 loop
        player:=gen_random_uuid();
        insert into auth.users(id) values(player);
        insert into pq_private.player_accounts(user_id,name,avatar) values(player,'Жишээ','scout');
        insert into pq_private.score_participants(user_id,alias,joined) values(player,'Сорил '||n,true);
        insert into pq_private.score_ledger(user_id,milestone,xp,earned_on) values(player,'test',500,day_now);
    end loop;
    board:=public.pq_leaderboard('month');
    assert jsonb_array_length(board->'rows')=10 and (board->'self'->>'rank')::integer=11;
    assert not exists(select 1 from jsonb_array_elements(board->'rows') r where (r->>'me')::boolean);
    assert (select count(*) from pq_private.score_milestones(jsonb_build_object(
       'done',(select jsonb_agg(i) from generate_series(0,29) i),'battles','{"won":[0,1,2,3,4]}'::jsonb)))=35;
    assert (select sum(points) from pq_private.score_milestones(jsonb_build_object(
       'done',(select jsonb_agg(i) from generate_series(0,29) i),'battles','{"won":[0,1,2,3,4]}'::jsonb)))=4360;
end; $$;
rollback;
