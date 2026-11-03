'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { defineApi, ApiRegistry, ApiError, unauthorized, notFound } = require('../src');
const { apis } = require('../examples/books.api');

const make = (overrides) =>
  defineApi({
    name: 'x',
    version: '1',
    method: 'GET',
    path: '/x',
    query: { mode: 'many', sql: 'SELECT 1' },
    ...overrides,
  });

test('groups versions of the same route together', () => {
  const registry = new ApiRegistry([make({ version: '1' }), make({ version: '2' }), make({ path: '/y' })]);
  assert.equal(registry.routes.size, 2);
  const route = registry.routes.get('GET /x');
  assert.deepEqual([...route.versions.keys()], ['1', '2']);
});

test('latest() compares versions numerically, not alphabetically', () => {
  const registry = new ApiRegistry([make({ version: '2' }), make({ version: '10' })]);
  assert.equal(ApiRegistry.latest(registry.routes.get('GET /x')), '10');
});

test('rejects a duplicate route and version', () => {
  assert.throws(() => new ApiRegistry([make(), make()]), /Duplicate API/);
});

test('describe() summarizes routes for documentation', () => {
  const docs = new ApiRegistry(apis).describe();
  const list = docs.find((route) => route.path === '/books');
  assert.equal(list.latestVersion, '2');
  assert.equal(list.versions.length, 2);
  assert.equal(list.versions[0].auth.permission, 'books:read');
  assert.equal(list.versions[0].paginated, true);
});

test('the bundled example definitions are valid', () => {
  assert.equal(apis.length, 3);
});

test('error helpers carry status and code', () => {
  const error = unauthorized();
  assert.ok(error instanceof ApiError);
  assert.equal(error.status, 401);
  assert.equal(notFound().code, 'NOT_FOUND');
});
