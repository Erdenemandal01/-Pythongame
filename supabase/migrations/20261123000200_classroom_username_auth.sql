begin;

-- Auth > Hooks > Before User Created:
-- pg-functions://postgres/public/pq_before_user_created
create function public.pq_before_user_created(event jsonb) returns jsonb
language plpgsql immutable security invoker set search_path = '' as $$
declare
    username text := event #>> '{user,user_metadata,username}';
    rejected constant jsonb := '{"error":{"http_code":403,"message":"Тоглоомын хэрэглэгчийн нэрээр бүртгүүлнэ үү."}}';
    expected_email text;
begin
    -- The browser sends NFC lowercase. Checking the exact alphabet avoids
    -- database locale/case-folding differences for Mongolian Ө and Ү.
    if jsonb_typeof(event #> '{user,user_metadata,username}') is distinct from 'string'
        or char_length(username) not between 3 and 24
        or username collate pg_catalog."C" ~ '[^a-zа-яёөү0-9_-]'
        or coalesce(event #>> '{user,phone}', '') <> ''
        or coalesce(event #>> '{user,is_anonymous}', 'false') <> 'false'
        or coalesce(event #>> '{user,app_metadata,provider}', 'email') <> 'email' then
        return rejected;
    end if;
    expected_email := 'p-' || left(encode(sha256(convert_to(username, 'UTF8')), 'hex'), 48)
        || '@players.kodyn-nuudel.invalid';
    if (event #>> '{user,email}') collate pg_catalog."C" is distinct from expected_email then
        return rejected;
    end if;
    return '{}'::jsonb;
end;
$$;

revoke all on function public.pq_before_user_created(jsonb)
    from public, anon, authenticated, service_role;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.pq_before_user_created(jsonb) to supabase_auth_admin;

commit;
