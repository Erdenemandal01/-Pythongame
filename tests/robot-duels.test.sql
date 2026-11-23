-- Run with ON_ERROR_STOP on a disposable Supabase database after the migrations.
begin;
insert into auth.users(id) values
    ('00000000-1200-4000-9940-000000000001'),('00000000-1200-4000-9940-000000000002'),
    ('00000000-1200-4000-9940-000000000003');
insert into pq_private.player_accounts(user_id,name,avatar)
    select id,'Туршигч','scout' from auth.users where id::text like '00000000-1200-4000-9940-%';

set local role anon;
do $$ begin
    perform public.pq_robot_duel('create');
    raise exception 'Guest created a room';
exception when insufficient_privilege then null; end $$;
reset role;

set local role authenticated;
do $$
declare
    alice text := '00000000-1200-4000-9940-000000000001';
    bob text := '00000000-1200-4000-9940-000000000002';
    carol text := '00000000-1200-4000-9940-000000000003';
    match_code text;
    room jsonb;
    full_run jsonb := '[["move","collect","move","move","move","collect"],["move","move","move","collect","right","move","move","right","move","collect","move","move","collect"],["move","move","collect","move","move","right","move","collect","move","move","right","move","move","collect","move","move","right","move","collect"]]';
    one_gem jsonb := '[["move","collect"],["collect"],[]]';
begin
    perform set_config('request.jwt.claim.sub',alice,true);
    assert public.pq_robot_duel('resume') is null;
    room := public.pq_robot_duel('create'); match_code := room->>'code';
    assert match_code ~ '^[0-9A-F]{8}$' and room->>'role' = 'host' and room->>'status' = 'waiting';
    assert public.pq_robot_duel('resume') = room and public.pq_robot_duel('create') = room;
    assert public.pq_robot_duel('join',match_code) = room;
    begin
        perform public.pq_robot_duel('submit',match_code,full_run); raise exception 'Submitted alone';
    exception when sqlstate 'PT409' then null; end;

    perform set_config('request.jwt.claim.sub',bob,true);
    begin
        perform public.pq_robot_duel('read',match_code); raise exception 'Nonmember read a room';
    exception when sqlstate 'PT404' then null; end;
    room := public.pq_robot_duel('join','  ' || lower(match_code));
    assert room->>'role' = 'guest' and room->>'status' = 'playing';
    assert public.pq_robot_duel('join',match_code) = room and public.pq_robot_duel('resume') = room;
    begin
        perform public.pq_robot_duel('submit',match_code,'[["collect","move"],[],[]]'); raise exception 'Moved after failure';
    exception when sqlstate 'PT422' then null; end;
    begin
        perform public.pq_robot_duel('submit',match_code,'[["warp"],[],[]]'); raise exception 'Accepted unsupported command';
    exception when sqlstate 'PT422' then null; end;
    begin
        perform public.pq_robot_duel('submit',match_code,'{"solved":3}'); raise exception 'Accepted forged score';
    exception when sqlstate 'PT422' then null; end;
    begin
        perform public.pq_robot_duel('submit',match_code,jsonb_set(full_run,'{0}',(full_run->0)||'["right"]'));
        raise exception 'Moved after win';
    exception when sqlstate 'PT422' then null; end;
    begin
        perform public.pq_robot_duel('submit',match_code,jsonb_build_array(to_jsonb(array_fill('right'::text,array[41])),'[]'::jsonb,'[]'::jsonb));
        raise exception 'Accepted more than 40 actions';
    exception when sqlstate 'PT422' then null; end;
    room := public.pq_robot_duel('submit',match_code,one_gem);
    assert room#>>'{guest,submitted}' = 'true' and room#>'{guest,result}' = 'null'::jsonb;
    assert public.pq_robot_duel('submit',match_code,full_run) = room;

    perform set_config('request.jwt.claim.sub',carol,true);
    begin
        perform public.pq_robot_duel('join',match_code); raise exception 'Third player joined';
    exception when sqlstate 'PT409' then null; end;
    begin
        perform public.pq_robot_duel('submit',match_code,full_run); raise exception 'Third player submitted';
    exception when sqlstate 'PT404' then null; end;
    begin
        perform 1 from pq_private.robot_duels; raise exception 'Room table is client-readable';
    exception when insufficient_privilege then null; end;

    perform set_config('request.jwt.claim.sub',alice,true);
    assert public.pq_robot_duel('read',match_code)#>'{guest,result}' = 'null'::jsonb;
    room := public.pq_robot_duel('submit',match_code,full_run);
    assert room->>'status' = 'finished';
    assert room#>'{host,result}' = jsonb_build_object('solved',3,'gems',9,'boards','[true,true,true]'::jsonb,'traces',full_run);
    assert room#>'{guest,result}' = jsonb_build_object('solved',0,'gems',1,'boards','[false,false,false]'::jsonb,'traces',one_gem);
    assert room::text not like '%'||alice||'%' and room::text not like '%'||bob||'%';
    assert public.pq_robot_duel('resume') is null;
    assert public.pq_robot_duel('leave',match_code) is null;
    perform set_config('request.jwt.claim.sub',bob,true);
    assert public.pq_robot_duel('read',match_code)->>'status' = 'finished';
    match_code := public.pq_robot_duel('create')->>'code';
    assert public.pq_robot_duel('leave',match_code) is null;
    assert public.pq_robot_duel('leave',match_code) is null;
    assert public.pq_robot_duel('resume') is null;
end; $$;
reset role;
rollback;
