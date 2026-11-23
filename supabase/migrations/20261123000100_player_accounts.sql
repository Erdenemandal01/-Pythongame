begin;

create schema pq_private;
revoke all on schema pq_private from public, anon, authenticated;
grant usage on schema pq_private to authenticated;

-- Nicknames may be shared. Only Supabase Auth's verified user ID identifies a pupil.
create table pq_private.player_accounts (
    user_id uuid primary key references auth.users (id) on delete cascade,
    account_key uuid not null unique default gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 24),
    avatar text not null check (avatar in ('scout', 'mage', 'ranger', 'mechanic')),
    revision bigint not null default 0 check (revision between 0 and 9007199254740991),
    save jsonb
);

alter table pq_private.player_accounts enable row level security;
create policy own_player_account on pq_private.player_accounts
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
revoke all on pq_private.player_accounts from public, anon, authenticated;

create function pq_private.validate_save(payload json) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare
    document jsonb;
begin
    if octet_length(payload::text) > 12 * 1024 * 1024 then
        raise sqlstate 'PT413' using message = 'save_too_large';
    end if;
    document := payload::jsonb;
    if (document -> 'version') is distinct from '1'::jsonb
        or jsonb_typeof(document -> 'done') is distinct from 'array' then
        raise sqlstate 'PT422' using message = 'invalid_save';
    end if;
    if exists (
        select 1 from jsonb_array_elements(document -> 'done') as completed(id)
        where case when jsonb_typeof(id) = 'number' then
            id::numeric <> trunc(id::numeric) or id::numeric not between 0 and 9007199254740991
        else true end
    ) then
        raise sqlstate 'PT422' using message = 'invalid_save';
    end if;
    return document;
end;
$$;

-- Only this routine can write the table. Every read and write uses auth.uid().
create function pq_private.account(p_action text, p_data json, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    uid uuid := auth.uid();
    player pq_private.player_accounts%rowtype;
    enrollment text := 'enroll:' || uid::text;
    player_name text;
    player_avatar text;
    progress jsonb;
    expected numeric;
begin
    if uid is null then
        raise sqlstate 'PT401' using message = 'sign_in_required';
    end if;
    if p_action is null or p_action not in ('account', 'register', 'profile', 'read_save', 'write_save') then
        raise sqlstate 'PT404' using message = 'not_found';
    end if;

    if p_action = 'register' then
        if p_key is distinct from enrollment then
            raise sqlstate 'PT412' using message = 'account_changed';
        end if;
    else
        select * into player from pq_private.player_accounts where user_id = uid;
        if not found then
            if p_action = 'account' then
                return jsonb_build_object('authenticated', true, 'profile', null, 'revision', 0,
                    'hasSave', false, 'contextKey', enrollment);
            end if;
            raise sqlstate 'PT404' using message = 'profile_required';
        end if;
        if p_action <> 'account' and (p_action <> 'read_save' or p_key is not null)
            and p_key is distinct from player.account_key::text then
            raise sqlstate 'PT412' using message = 'account_changed';
        end if;
    end if;

    if p_action in ('register', 'profile') then
        player_name := normalize(btrim(p_data ->> 'name'), NFC);
        player_avatar := p_data ->> 'avatar';
        -- Match the nickname form's Unicode control/format and angle bracket check.
        if json_typeof(p_data -> 'name') is distinct from 'string'
            or char_length(player_name) not between 2 and 24
            or player_name collate pg_catalog."C" ~ U&'[<>\0001-\001f\007f-\009f\00ad\0600-\0605\061c\06dd\070f\0890-\0891\08e2\180e\200b-\200f\202a-\202e\2060-\2064\2066-\206f\feff\fff9-\fffb\+0110bd\+0110cd\+013430-\+01343f\+01bca0-\+01bca3\+01d173-\+01d17a\+0e0001\+0e0020-\+0e007f]'
            or player_avatar is null or player_avatar not in ('scout', 'mage', 'ranger', 'mechanic') then
            raise sqlstate 'PT422' using message = 'invalid_profile';
        end if;
    end if;

    case p_action
        when 'register' then
            if json_typeof(p_data -> 'save') is not null and json_typeof(p_data -> 'save') <> 'null' then
                progress := pq_private.validate_save(p_data -> 'save');
            end if;
            insert into pq_private.player_accounts(user_id, name, avatar, revision, save)
            values (uid, player_name, player_avatar, case when progress is null then 0 else 1 end, progress)
            on conflict (user_id) do nothing returning * into player;
            if not found then
                raise sqlstate 'PT409' using message = 'already_registered';
            end if;
        when 'profile' then
            update pq_private.player_accounts set name = player_name, avatar = player_avatar
                where user_id = uid and account_key::text = p_key returning * into player;
            if not found then
                raise sqlstate 'PT412' using message = 'account_changed';
            end if;
        when 'read_save' then
            return jsonb_build_object('accountKey', player.account_key, 'revision', player.revision, 'save', player.save);
        when 'write_save' then
            if json_typeof(p_data -> 'revision') is distinct from 'number' then
                raise sqlstate 'PT422' using message = 'invalid_revision';
            end if;
            expected := (p_data ->> 'revision')::numeric;
            if expected <> trunc(expected) or expected not between 0 and 9007199254740991 then
                raise sqlstate 'PT422' using message = 'invalid_revision';
            end if;
            if expected <> player.revision then
                raise sqlstate 'PT409' using message = 'revision_conflict';
            end if;
            progress := pq_private.validate_save(p_data -> 'save');
            update pq_private.player_accounts set revision = revision + 1, save = progress
                where user_id = uid and account_key::text = p_key and revision = expected
                returning * into player;
            if not found then
                raise sqlstate 'PT409' using message = 'revision_conflict';
            end if;
            return jsonb_build_object('accountKey', player.account_key, 'revision', player.revision);
        else
            null;
    end case;
    return jsonb_build_object('authenticated', true, 'accountKey', player.account_key,
        'profile', jsonb_build_object('name', player.name, 'avatar', player.avatar),
        'revision', player.revision, 'hasSave', player.save is not null);
end;
$$;

-- Keep the privileged routine outside the Data API's exposed schemas.
create function public.pq_account(p_action text, p_data json default '{}', p_key text default null)
returns jsonb language sql security invoker set search_path = '' as $$
    select pq_private.account(p_action, p_data, p_key);
$$;
revoke all on function pq_private.validate_save(json), pq_private.account(text,json,text),
    public.pq_account(text,json,text) from public, anon, authenticated;
grant execute on function pq_private.account(text,json,text), public.pq_account(text,json,text)
    to authenticated;

commit;
