'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { jwt, password } = require('../src');
const { permits } = require('../src/framework/middlewares/authorize');

test('tokens round-trip and carry claims', () => {
  const token = jwt.sign({ sub: 7, permissions: ['books:read'] }, 'secret');
  const claims = jwt.verify(token, 'secret');
  assert.equal(claims.sub, 7);
  assert.deepEqual(claims.permissions, ['books:read']);
});

test('tokens are rejected when tampered, signed with another secret, expired or alg-swapped', () => {
  const token = jwt.sign({ sub: 1 }, 'secret');
  const [h, p, s] = token.split('.');
  assert.throws(() => jwt.verify(`${h}.${p}.${s.slice(0, -1)}A`, 'secret'), /signature/);
  assert.throws(() => jwt.verify(token, 'other'), /signature/);
  const old = jwt.sign({ sub: 1 }, 'secret', { expiresInSeconds: 1, now: Date.now() - 10_000 });
  assert.throws(() => jwt.verify(old, 'secret'), /expired/);
  const none = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${p}.`;
  assert.throws(() => jwt.verify(none, 'secret'), /algorithm/);
});

test('passwords hash with a salt and verify', async () => {
  const a = await password.hashPassword('correct-horse');
  const b = await password.hashPassword('correct-horse');
  assert.notEqual(a, b);
  assert.equal(await password.verifyPassword('correct-horse', a), true);
  assert.equal(await password.verifyPassword('wrong', a), false);
  assert.equal(await password.verifyPassword('x', 'garbage'), false);
});

test('permission matching: exact, namespace wildcard, global wildcard', () => {
  assert.equal(permits(['books:read'], 'books:read'), true);
  assert.equal(permits(['books:*'], 'books:write'), true);
  assert.equal(permits(['*'], 'anything:at_all'), true);
  assert.equal(permits(['books:read'], 'books:write'), false);
  assert.equal(permits(['authors:*'], 'books:read'), false);
});
