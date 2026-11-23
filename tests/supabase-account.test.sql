-- Run with psql -v ON_ERROR_STOP=1 after the migration on a disposable Supabase DB.
begin;
insert into auth.users (id) values
    ('a0a0a0a0-1234-4920-acca-475fbedb5321'), ('b0b0b0b0-1234-4920-acca-475fbedb5321');

set local role anon;
do $$
begin
    perform public.pq_account('account');
    raise exception 'Guest could read accounts';
exception when insufficient_privilege then null;
end;
$$;
reset role;
set local role authenticated;

do $$
declare
    alice uuid := 'a0a0a0a0-1234-4920-acca-475fbedb5321';
    bob uuid := 'b0b0b0b0-1234-4920-acca-475fbedb5321';
    enrollment text;
    alice_key text;
    bob_key text;
    info jsonb;
    profile json := '{"name":"Хайгуулч","avatar":"scout"}';
    initial json := '{"name":"Хайгуулч","avatar":"mage","save":{"version":1,"done":[1],"draft":"print(\"🐉\")"}}';
    progress json := '{"revision":1,"save":{"version":1,"done":[1,2],"draft":"print(5)"}}';
begin
    perform set_config('request.jwt.claim.sub', alice::text, true);
    info := public.pq_account('account');
    assert info->'profile' = 'null'::jsonb;
    enrollment := info->>'contextKey';
    assert enrollment is not null;
    info := public.pq_account('register', initial, enrollment);
    assert info->>'revision' = '1' and (info->>'hasSave')::boolean;
    alice_key := info->>'accountKey';
    assert public.pq_account('read_save','{}',alice_key)->'save' = initial::jsonb->'save';
    begin
        perform public.pq_account('register', profile, enrollment);
        raise exception 'Second registration overwrote an account';
    exception when sqlstate 'PT409' then null;
    end;
    info := public.pq_account('write_save',progress,alice_key);
    assert info->>'revision' = '2';
    begin
        perform public.pq_account('write_save',progress,alice_key);
        raise exception 'Old browser overwrote newer save';
    exception when sqlstate 'PT409' then null;
    end;
    begin
        perform public.pq_account('write_save','{"revision":2,"save":{"version":1,"done":[true]}}',alice_key);
        raise exception 'Invalid save accepted';
    exception when sqlstate 'PT422' then null;
    end;
    begin
        perform public.pq_account('write_save', json_build_object('revision',2,'save',
            json_build_object('version',1,'done','[]'::json,'draft',repeat('x',12582913))),alice_key);
        raise exception 'Oversize save accepted';
    exception when sqlstate 'PT413' then null;
    end;
    assert public.pq_account('read_save','{}',alice_key)->'save' = progress::jsonb->'save';
    info := public.pq_account('profile',profile,alice_key);
    assert info->'profile' = profile::jsonb and info->>'revision' = '2';

    perform set_config('request.jwt.claim.sub', bob::text, true);
    begin
        perform public.pq_account('register',profile,enrollment);
        raise exception 'Signed-in user could use another enrollment context';
    exception when sqlstate 'PT412' then null;
    end;
    info := public.pq_account('account');
    info := public.pq_account('register',profile,info->>'contextKey');
    bob_key := info->>'accountKey';
    assert bob_key <> alice_key and info->>'revision' = '0';
    assert public.pq_account('read_save','{}',bob_key)->'save' = 'null'::jsonb;
    begin
        perform public.pq_account('read_save','{}',alice_key);
        raise exception 'Wrong user could read previous account';
    exception when sqlstate 'PT412' then null;
    end;
    begin
        perform public.pq_account('write_save',progress,alice_key);
        raise exception 'Wrong user could edit previous account';
    exception when sqlstate 'PT412' then null;
    end;
    begin
        perform user_id from pq_private.player_accounts;
        raise exception 'Unexpected direct table access';
    exception when insufficient_privilege then null;
    end;
end;
$$;

-- RLS still scopes a read if table permissions are explicitly granted in future.
reset role;
grant select on pq_private.player_accounts to authenticated;
set local role authenticated;
do $$
begin
    assert (select count(*) = 1 and bool_and(user_id = auth.uid()) from pq_private.player_accounts);
end;
$$;
rollback;
