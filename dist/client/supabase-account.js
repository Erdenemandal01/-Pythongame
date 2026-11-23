/* The Vercel build supplies the public project configuration and Supabase SDK. */
(() => {
    'use strict';
    const config = window.PQ_SUPABASE;
    if (!config || location.protocol === 'file:' || window.PQ_CLASSROOM_KIT) return;

    const actions = {'': 'account', '/register': 'register', '/profile': 'profile'};
    let client;
    function service() {
        if (!client) client = window.supabase.createClient(config.url, config.publishableKey, {
            auth: {flowType: 'implicit', detectSessionInUrl: false}
        });
        return client;
    }
    function normalizeUsername(value) {
        return value.normalize('NFC').trim().toLowerCase().normalize('NFC');
    }
    function validUsername(value) {
        return /^[a-zа-яёөү0-9_-]{3,24}$/u.test(normalizeUsername(value));
    }
    async function loginAlias(username) {
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(username));
        const prefix = Array.from(new Uint8Array(hash).slice(0,24), byte => byte.toString(16).padStart(2, '0')).join('');
        return 'p-' + prefix + '@players.kodyn-nuudel.invalid';
    }
    async function session() {
        const {data, error} = await service().auth.getSession();
        if (error) throw error;
        return data.session;
    }
    async function userId() {
        return (await session())?.user?.id ?? null;
    }
    function watch(fn) {
        // Auth listeners run under the SDK session lock. Make database requests after it releases.
        service().auth.onAuthStateChange((_event, current) => {
            const id = current?.user?.id ?? null;
            setTimeout(() => fn(id), 0);
        });
    }
    async function identify(signup, name, password) {
        const username = normalizeUsername(name);
        if (!validUsername(username)) throw Object.assign(Error('invalid_username'), {code: 'invalid_username'});
        const email = await loginAlias(username);
        const auth = service().auth;
        const result = signup
            ? await auth.signUp({email, password, options: {data: {username}}})
            : await auth.signInWithPassword({email, password});
        if (result.error) throw result.error;
        if (!result.data.session?.user?.id) throw Object.assign(Error('signup_unavailable'), {code: 'signup_unavailable'});
        return result.data.session.user.id;
    }
    async function signOut() {
        const {error} = await service().auth.signOut({scope: 'local'});
        if (error) throw error;
    }
    async function playerRpc(name, params, expectedUserId) {
        const active = await session();
        if (!active || active.user.id !== expectedUserId) {
            throw Object.assign(Error('account_changed'), {status: 401});
        }
        // Bind the action to the pupil who started it on a shared computer.
        const result = await service().rpc(name, params)
            .setHeader('Authorization', 'Bearer ' + active.access_token)
            .abortSignal(AbortSignal.timeout(15000));
        if (result.error) throw Object.assign(Error(result.error.message), {status: result.status});
        return result.data;
    }
    function leaderboard(period, join, expectedUserId) {
        return playerRpc('pq_leaderboard', {p_period:period, p_join:join}, expectedUserId);
    }
    function duel(action, code, traces, expectedUserId) {
        return playerRpc('pq_robot_duel', {p_action:action, p_code:code ?? null, p_traces:traces ?? null}, expectedUserId);
    }
    async function api(path, method, body, key, enrollment) {
        if (!await session()) {
            if (path === '') return {authenticated: false};
            throw Object.assign(Error('sign_in_required'), {status: 401});
        }
        const operation = path === '/save' ? (method === 'GET' ? 'read_save' : 'write_save') : actions[path];
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const result = await service().rpc('pq_account', {
                p_action: operation, p_data: body ?? {}, p_key: enrollment || key || null
            }).abortSignal(controller.signal);
            if (result.error) throw Object.assign(Error(result.error.message), {status: result.status});
            return result.data;
        } finally { clearTimeout(timeout); }
    }
    window.PQUsernameAccount = {api, identify, signOut, userId, validUsername, watch, leaderboard, duel};
})();
