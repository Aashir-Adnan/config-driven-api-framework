'use strict';

// Walks the example API through its main behaviours and prints one line per request.
process.removeAllListeners('warning');
const { buildExampleApp } = require('./app');

async function main() {
  const { app, db } = await buildExampleApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  let token = null;

  const call = async (label, method, path, { body, auth, version } = {}) => {
    const headers = { 'content-type': 'application/json' };
    if (auth) headers.authorization = `Bearer ${auth}`;
    if (version) headers['x-api-version'] = version;
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json();
    const summary = json.success
      ? summarize(json)
      : `${json.error.code} (${Array.isArray(json.error.details) ? json.error.details.map((d) => d.message).join('; ') : json.error.message}${json.error.details && !Array.isArray(json.error.details) ? ' ' + JSON.stringify(json.error.details) : ''})`;
    console.log(`${String(res.status).padEnd(4)}${label.padEnd(46)}${summary}`);
    return json;
  };

  const summarize = (json) => {
    if (Array.isArray(json.data)) {
      const titles = json.data.map((b) => b.title).join(', ');
      return `${json.data.length} rows${json.meta ? ` (page ${json.meta.page}/${json.meta.totalPages}, total ${json.meta.total})` : ''}: ${titles.slice(0, 60)}${titles.length > 60 ? '...' : ''}`;
    }
    if (json.data && json.data.token) return 'token issued';
    return JSON.stringify(json.data);
  };

  try {
    await call('list books without a token', 'GET', '/books');
    await call('login with a wrong password', 'POST', '/auth/login', { body: { email: 'reader@example.com', password: 'wrong-pass' } });
    const reader = await call('login as reader', 'POST', '/auth/login', { body: { email: 'reader@example.com', password: 'correct-horse' } });
    const admin = await call('login as admin', 'POST', '/auth/login', { body: { email: 'admin@example.com', password: 'correct-horse' } });
    token = reader.data.token;
    await call('reader lists books, v1, page size 2', 'GET', '/books?pageSize=2', { auth: token, version: '1' });
    await call('reader searches books, v2 (latest)', 'GET', '/books?search=data', { auth: token });
    await call('reader asks for API version 9', 'GET', '/books', { auth: token, version: '9' });
    await call('reader gets book 3', 'GET', '/books/3', { auth: token });
    await call('reader gets book "abc"', 'GET', '/books/abc', { auth: token });
    await call('reader tries to create a book', 'POST', '/books', { auth: token, body: { title: 'X', author: 'Y' } });
    await call('admin creates with a too-short title', 'POST', '/books', { auth: admin.data.token, body: { title: 'X', author: 'Y' } });
    await call('admin creates a book', 'POST', '/books', { auth: admin.data.token, body: { title: 'Refactoring', author: 'Fowler', year: 2018 } });
    await call('admin deletes book 2', 'DELETE', '/books/2', { auth: admin.data.token });
    await call('admin deletes book 2 again', 'DELETE', '/books/2', { auth: admin.data.token });
    await call('tampered token', 'GET', '/books', { auth: `${token.slice(0, -2)}xx` });
  } finally {
    server.close();
    await db.close();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
