// Loaded explicitly by the isolated test server only. No real email is sent.
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const originalFetch = globalThis.fetch;
globalThis.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input.url ?? String(input);
  if (url === 'https://api.resend.com/emails' && init?.method === 'POST') {
    const body = JSON.parse(init.body);
    if (!process.env.TEAM_TEST_OUTBOX) throw new Error('Test outbox must be configured');
    if (body.to[0].startsWith('fail+')) return new Response(JSON.stringify({ message: 'Mock provider rejected this sender' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    const id = randomUUID();
    fs.appendFileSync(process.env.TEAM_TEST_OUTBOX, JSON.stringify({ id, ...body }) + '\n');
    return new Response(JSON.stringify({ id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.startsWith('https://api.resend.com/emails/')) return new Response(JSON.stringify({ last_event: 'delivered' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  return originalFetch(input, init);
};
