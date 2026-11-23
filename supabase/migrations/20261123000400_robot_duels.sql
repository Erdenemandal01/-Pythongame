begin;

create table pq_private.robot_duels (
    code text primary key,
    host_id uuid not null references pq_private.player_accounts(user_id) on delete cascade,
    guest_id uuid references pq_private.player_accounts(user_id) on delete cascade,
    expires_at timestamptz not null default (statement_timestamp() + interval '2 hours'),
    host_result jsonb,
    guest_result jsonb,
    check (host_id <> guest_id),
    check (guest_result is null or guest_id is not null)
);
create index robot_duels_host on pq_private.robot_duels(host_id);
create index robot_duels_guest on pq_private.robot_duels(guest_id) where guest_id is not null;
create index robot_duels_expiry on pq_private.robot_duels(expires_at);
alter table pq_private.robot_duels enable row level security;
revoke all on pq_private.robot_duels from public, anon, authenticated;

-- Replay actions on the official courses. Neither a client score nor its finish time is used.
create function pq_private.robot_duel_score(p_traces jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare
    course text[];
    run jsonb;
    command text;
    tile text;
    x integer; y integer; nx integer; ny integer; heading integer;
    dx integer[] := array[1,0,-1,0];
    dy integer[] := array[0,1,0,-1];
    needed integer; collected integer;
    stopped boolean;
    solved integer := 0;
    gems integer := 0;
    wins boolean[] := '{}';
begin
    if jsonb_typeof(p_traces) is distinct from 'array' or octet_length(p_traces::text) > 4096 then
        raise sqlstate 'PT422' using message = 'invalid_traces';
    end if;
    if jsonb_array_length(p_traces) <> 3 then raise sqlstate 'PT422' using message = 'invalid_traces'; end if;
    for i in 0..2 loop
        course := case i when 0 then array['.G..G'] when 1 then array['...G','###.','G.G.']
                        else array['..G..','####G','G###.','..G..'] end;
        select sum(length(row_text) - length(replace(row_text,'G',''))) into needed from unnest(course) row_text;
        collected := 0; stopped := false; x := 0; y := 0; heading := 0;
        run := p_traces -> i;
        if jsonb_typeof(run) is distinct from 'array' then raise sqlstate 'PT422' using message = 'invalid_traces'; end if;
        if jsonb_array_length(run) > 40 then raise sqlstate 'PT422' using message = 'invalid_traces'; end if;
        for command in select value from jsonb_array_elements_text(run) loop
            if stopped then raise sqlstate 'PT422' using message = 'invalid_traces'; end if;
            case command
                when 'right' then heading := (heading + 1) % 4;
                when 'move' then
                    nx := x + dx[heading + 1]; ny := y + dy[heading + 1];
                    if nx < 0 or ny < 0 or ny >= cardinality(course) or nx >= length(course[1])
                        or substr(course[ny+1], nx+1, 1) = '#' then
                        stopped := true;
                    else
                        x := nx; y := ny;
                    end if;
                when 'collect' then
                    tile := substr(course[y+1], x+1, 1);
                    if tile = 'G' then
                        course[y+1] := overlay(course[y+1] placing '.' from x+1 for 1);
                        collected := collected + 1; stopped := collected = needed;
                    else
                        stopped := true;
                    end if;
                else raise sqlstate 'PT422' using message = 'invalid_traces';
            end case;
        end loop;
        gems := gems + collected;
        wins := array_append(wins, collected = needed);
        if collected = needed then solved := solved + 1; end if;
    end loop;
    return jsonb_build_object('solved',solved,'gems',gems,'boards',wins,'traces',p_traces);
end;
$$;

create function pq_private.robot_duel(p_action text,p_code text,p_traces jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    uid uuid := auth.uid();
    room pq_private.robot_duels%rowtype;
    code_arg text := upper(btrim(p_code));
    finished boolean;
    result jsonb;
begin
    if uid is null then raise sqlstate 'PT401' using message = 'sign_in_required'; end if;
    if not exists (select 1 from pq_private.player_accounts where user_id = uid) then
        raise sqlstate 'PT404' using message = 'profile_required';
    end if;
    if p_action in ('create','join') then
        -- Serialize room selection for two tabs of the same pupil, including joins to different rooms.
        perform pg_advisory_xact_lock(hashtextextended('robot-duel:' || uid::text, 0));
    end if;
    if p_action in ('create','resume') then
        if p_action = 'create' then
            delete from pq_private.robot_duels where expires_at <= statement_timestamp();
        end if;
        select * into room from pq_private.robot_duels
            where (host_id = uid or guest_id = uid) and expires_at > statement_timestamp()
                and (host_result is null or guest_result is null)
            order by expires_at desc limit 1;
        if not found then
            if p_action = 'resume' then return null; end if;
            loop
                insert into pq_private.robot_duels(code,host_id)
                    values (upper(left(gen_random_uuid()::text,8)),uid)
                    on conflict (code) do nothing returning * into room;
                exit when found;
            end loop;
        end if;
    elsif p_action in ('join','read','submit','leave') then
        if code_arg is null or code_arg !~ '^[0-9A-F]{8}$' then
            raise sqlstate 'PT404' using message = 'room_unavailable';
        end if;
        if p_action = 'read' then
            select * into room from pq_private.robot_duels where code = code_arg
                and expires_at > statement_timestamp() and (host_id = uid or guest_id = uid);
        else
            select * into room from pq_private.robot_duels where code = code_arg and expires_at > statement_timestamp()
                and (p_action = 'join' or host_id = uid or guest_id = uid) for update;
        end if;
        if not found then
            if p_action = 'leave' then return null; end if;
            raise sqlstate 'PT404' using message = 'room_unavailable';
        end if;
        if p_action = 'join' and room.host_id <> uid and room.guest_id is distinct from uid then
            if room.guest_id is not null then raise sqlstate 'PT409' using message = 'room_full'; end if;
            if exists (select 1 from pq_private.robot_duels where (host_id = uid or guest_id = uid)
                and expires_at > statement_timestamp() and (host_result is null or guest_result is null)) then
                raise sqlstate 'PT409' using message = 'other_room_active';
            end if;
            update pq_private.robot_duels set guest_id = uid where code = room.code returning * into room;
        elsif p_action = 'leave' then
            if room.host_result is null or room.guest_result is null then
                delete from pq_private.robot_duels where code = room.code;
            end if;
            return null;
        elsif p_action = 'submit' then
            if room.guest_id is null then raise sqlstate 'PT409' using message = 'waiting_for_guest'; end if;
            -- First valid submission is final. A retry simply returns the current room.
            if (uid = room.host_id and room.host_result is null) or (uid = room.guest_id and room.guest_result is null) then
                result := pq_private.robot_duel_score(p_traces);
                if uid = room.host_id then
                    update pq_private.robot_duels set host_result = result where code = room.code returning * into room;
                else
                    update pq_private.robot_duels set guest_result = result where code = room.code returning * into room;
                end if;
            end if;
        end if;
    else raise sqlstate 'PT422' using message = 'invalid_duel_action';
    end if;
    finished := room.host_result is not null and room.guest_result is not null;
    return jsonb_build_object('code',room.code,'role',case when room.host_id = uid then 'host' else 'guest' end,
        'status',case when finished then 'finished' when room.guest_id is null then 'waiting' else 'playing' end,
        'host',jsonb_build_object('submitted',room.host_result is not null,'result',case when finished then room.host_result end),
        'guest',case when room.guest_id is not null then
            jsonb_build_object('submitted',room.guest_result is not null,'result',case when finished then room.guest_result end) end);
end;
$$;

create function public.pq_robot_duel(p_action text,p_code text default null,p_traces jsonb default null) returns jsonb
language sql security invoker set search_path = '' as $$
    select pq_private.robot_duel(p_action,p_code,p_traces);
$$;
revoke all on function pq_private.robot_duel_score(jsonb),pq_private.robot_duel(text,text,jsonb),
    public.pq_robot_duel(text,text,jsonb) from public,anon,authenticated;
grant execute on function pq_private.robot_duel(text,text,jsonb),public.pq_robot_duel(text,text,jsonb) to authenticated;

commit;
