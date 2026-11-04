'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildExampleApp } = require('../examples/app');

let server;
let db;
let base;
const silent = { error: () => {} };

test.before(async () => {
  ({ app: server, db } = await buildExampleApp({ logger: silent }));
  server = server.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { server.close(); await db.close(); });

async function call(method, path, { body, token, version } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (version) headers['x-api-version'] = version;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json(), version: res.headers.get('x-api-version') };
}
const login = async (email) =>
  (await call('POST', '/auth/login', { body: { email, password: 'correct-horse' } })).body.data.token;

test('protected routes need a token', async () => {
  const res = await call('GET', '/books');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('pagination returns meta and the latest version by default', async () => {
  const token = await login('reader@example.com');
  const res = await call('GET', '/books?pageSize=2&page=2', { token });
  assert.equal(res.status, 200);
  assert.equal(res.version, '2');
  assert.equal(res.body.data.length, 2);
  assert.deepEqual(res.body.meta, { page: 2, pageSize: 2, total: 5, totalPages: 3 });
});

test('version header selects an older version and unknown versions are rejected', async () => {
  const token = await login('reader@example.com');
  assert.equal((await call('GET', '/books', { token, version: '1' })).version, '1');
  const bad = await call('GET', '/books', { token, version: '9' });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body.error.details.supported, ['1', '2']);
});

test('validation errors are per field and path params cannot be overridden by the query', async () => {
  const token = await login('reader@example.com');
  const res = await call('GET', '/books/abc?id=1', { token });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.details[0].param, 'id');
});

test('permissions gate writes', async () => {
  const reader = await login('reader@example.com');
  const admin = await login('admin@example.com');
  assert.equal((await call('POST', '/books', { token: reader, body: { title: 'Abc', author: 'D' } })).status, 403);
  const created = await call('POST', '/books', { token: admin, body: { title: 'Refactoring', author: 'Fowler' } });
  assert.equal(created.status, 201);
  const fetched = await call('GET', `/books/${created.body.data.id}`, { token: reader });
  assert.equal(fetched.body.data.title, 'Refactoring');
});

test('run queries can require a change and 404 otherwise', async () => {
  const admin = await login('admin@example.com');
  assert.equal((await call('DELETE', '/books/1', { token: admin })).status, 200);
  assert.equal((await call('DELETE', '/books/1', { token: admin })).status, 404);
  assert.equal((await call('GET', '/books/1', { token: admin })).body.error.message, 'Book not found');
});

test('/docs describes every route and unknown routes 404', async () => {
  const docs = await call('GET', '/docs');
  assert.ok(docs.body.data.some((r) => r.path === '/books/:id' && r.method === 'DELETE'));
  assert.equal((await call('GET', '/nope')).status, 404);
});

test('malformed JSON is a 400, not a crash', async () => {
  const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
});
