import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env.js';
import { purgeExpired } from './auth.js';
import { authRoutes } from './routes/auth.js';
import { hcsRoutes } from './routes/hcs.js';
import { legacyRoutes } from './routes/legacy.js';
import { expireOldRelays, relayRoutes } from './routes/relays.js';
import { streamRoutes } from './routes/stream.js';
import { userRoutes } from './routes/users.js';

const app = new Hono();

app.use('*', logger());

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/hedera', hcsRoutes);
app.route('/api/groups', streamRoutes);
app.route('/api/relays', relayRoutes);
app.route('/api/legacy', legacyRoutes);

app.onError((error, c) => {
  console.error('Unhandled error:', error);
  return c.json({ error: 'Something went wrong.' }, 500);
});

// The built frontend is served from this same process, so there is one origin,
// no CORS, and one thing to deploy.
app.use('/*', serveStatic({ root: env.staticDir }));

const indexHtml = (() => {
  try {
    return readFileSync(join(env.staticDir, 'index.html'), 'utf8');
  } catch {
    console.warn(`No frontend build found at ${env.staticDir}; serving API only.`);
    return null;
  }
})();

// Client-side routing: any non-API path falls back to the SPA entry point. An
// unmatched /api path must stay JSON — returning the HTML shell there makes a
// typo in a route look like a successful response.
app.get('*', (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Not found.' }, 404);
  }

  return indexHtml ? c.html(indexHtml) : c.json({ error: 'Not found.' }, 404);
});

// Housekeeping: drop stale nonces and sessions, and expire overdue relays.
const HOUSEKEEPING_INTERVAL_MS = 60_000;
setInterval(() => {
  try {
    purgeExpired();
    expireOldRelays();
  } catch (error) {
    console.error('Housekeeping failed:', error);
  }
}, HOUSEKEEPING_INTERVAL_MS).unref();

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`Aegis Protocol listening on http://localhost:${info.port}`);
});
