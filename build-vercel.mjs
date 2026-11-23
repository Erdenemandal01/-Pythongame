import { copyFile, cp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const urlInput = process.env.SUPABASE_URL?.trim();
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || '';
if (!urlInput) throw new Error('Set SUPABASE_URL to the project API URL before building.');
const url = new URL(urlInput);
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
if (!(url.protocol === 'https:' || (url.protocol === 'http:' && isLocal && !process.env.VERCEL))
    || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('SUPABASE_URL must be the HTTPS origin of the Supabase project.');
}

function isPublicKey(key) {
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
    if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(key)) return false;
    try {
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
        return payload.role === 'anon';
    } catch {
        return false;
    }
}
if (!isPublicKey(publishableKey)) {
    throw new Error('Set SUPABASE_PUBLISHABLE_KEY to a publishable key or legacy anon key.');
}

const dist = await realpath(fileURLToPath(new URL('./dist/', import.meta.url)));
const source = join(dist, 'client');
const output = join(dist, 'vercel');
const sdk = new URL('./node_modules/@supabase/supabase-js/', import.meta.url);
const index = await readFile(join(source, 'index.html'), 'utf8');
const start = '<template id="pq-game-scripts">';
if (!index.includes(start)) throw new Error('Desktop game bootstrap not found in dist/client/index.html.');
const scripts = '<script src="supabase-config.js"></script><script src="supabase-sdk.js"></script>';

// The output is a dedicated generated directory; never modify the Sites/offline sources.
await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
await copyFile(new URL('dist/umd/supabase.js', sdk), join(output, 'supabase-sdk.js'));
await copyFile(new URL('LICENSE', sdk), join(output, 'supabase-sdk-LICENSE.txt'));
await writeFile(join(output, 'supabase-config.js'),
    'window.PQ_SUPABASE = ' + JSON.stringify({ url: url.origin, publishableKey }) + ';\n');
await writeFile(join(output, 'index.html'), index.replace(start, start + scripts));
console.log('Vercel game built in dist/vercel');
