-- Run with psql -v ON_ERROR_STOP=1 after the classroom username migration.
begin;
do $$
begin
    assert not has_function_privilege('anon','public.pq_before_user_created(jsonb)','EXECUTE');
    assert not has_function_privilege('authenticated','public.pq_before_user_created(jsonb)','EXECUTE');
    assert not has_function_privilege('service_role','public.pq_before_user_created(jsonb)','EXECUTE');
end;
$$;
set local role supabase_auth_admin;
do $$
declare
    -- Known SHA-256 vectors generated from the canonical browser inputs.
    mongolian text := 'p-48ff59fc92acf15e95472eeb9f52afe6b52385a46f4a8661@players.kodyn-nuudel.invalid';
    latin text := 'p-3a5572e721478f10f52997c212b7cd742269ec94ac025fd2@players.kodyn-nuudel.invalid';
    sample jsonb := '{"user":{"user_metadata":{"username":"мөнхөө_үе23"},"app_metadata":{"provider":"email"},"is_anonymous":false,"phone":""}}';
    event jsonb := jsonb_set(sample, '{user,email}', to_jsonb(mongolian));
    bad jsonb;
    handle text;
begin
    assert public.pq_before_user_created(event) = '{}'::jsonb;
    assert public.pq_before_user_created(jsonb_set(jsonb_set(event,'{user,email}',to_jsonb(latin)),
        '{user,user_metadata,username}','"fox-runner_01"')) = '{}'::jsonb;
    foreach bad in array array[
        '{}'::jsonb, null::jsonb, event #- '{user,email}', event #- '{user,user_metadata}',
        jsonb_set(event,'{user,email}','"student@example.com"'), jsonb_set(event,'{user,email}',to_jsonb(latin)),
        jsonb_set(event,'{user,user_metadata,username}','123'), jsonb_set(event,'{user,phone}','"+12345"'),
        jsonb_set(event,'{user,is_anonymous}','true'), jsonb_set(event,'{user,app_metadata,provider}','"google"')
    ] loop
        assert public.pq_before_user_created(bad) #>> '{error,http_code}' = '403';
    end loop;
    foreach handle in array array['МӨНХӨӨ', 'ab', repeat('a',25), ' foo ', 'foo.bar', U&'е\0308жик', E'valid\n', '🎮'] loop
        -- Even a matching hash cannot register a non-canonical handle.
        bad := jsonb_set(event,'{user,email}',to_jsonb('p-' || left(encode(sha256(convert_to(handle,'UTF8')),'hex'),48) || '@players.kodyn-nuudel.invalid'));
        bad := jsonb_set(bad,'{user,user_metadata,username}',to_jsonb(handle));
        assert public.pq_before_user_created(bad) #>> '{error,http_code}' = '403';
    end loop;
end;
$$;
rollback;
