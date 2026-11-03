'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { defineApi } = require('../src');

const base = {
  name: 'books.list',
  version: '1',
  method: 'get',
  path: '/books',
  query: { mode: 'many', sql: 'SELECT 1' },
};

test('normalizes the method and fills defaults', () => {
  const api = defineApi(base);
  assert.equal(api.method, 'GET');
  assert.deepEqual(api.auth, { required: false });
  assert.deepEqual(api.params, {});
});

test('returns a frozen definition', () => {
  assert.ok(Object.isFrozen(defineApi(base)));
});

test('requires exactly one of query or handler', () => {
  assert.throws(() => defineApi({ ...base, query: undefined }), /exactly one/);
  assert.throws(() => defineApi({ ...base, handler: async () => ({}) }), /exactly one/);
});

test('rejects bad versions, methods and paths', () => {
  assert.throws(() => defineApi({ ...base, version: 'v1' }), /numeric string/);
  assert.throws(() => defineApi({ ...base, method: 'TRACE' }), /unsupported method/);
  assert.throws(() => defineApi({ ...base, path: 'books' }), /start with "\/"/);
});

test('rejects an unknown query mode and a query with no SQL source', () => {
  assert.throws(() => defineApi({ ...base, query: { mode: 'all', sql: 'x' } }), /query\.mode/);
  assert.throws(() => defineApi({ ...base, query: { mode: 'many' } }), /"sql" or a "build"/);
});

test('a permission requires authentication', () => {
  assert.throws(() => defineApi({ ...base, auth: { permission: 'books:read' } }), /auth\.required/);
  assert.doesNotThrow(() => defineApi({ ...base, auth: { required: true, permission: 'books:read' } }));
});

test('pagination adds page and pageSize parameters', () => {
  const api = defineApi({ ...base, pagination: { pageSize: 25, maxPageSize: 50 } });
  assert.equal(api.params.page.default, 1);
  assert.equal(api.params.pageSize.default, 25);
  assert.equal(api.params.pageSize.max, 50);
});

test('pagination is only allowed on "many" queries', () => {
  assert.throws(
    () => defineApi({ ...base, query: { mode: 'one', sql: 'SELECT 1' }, pagination: {} }),
    /pagination only applies/,
  );
});
