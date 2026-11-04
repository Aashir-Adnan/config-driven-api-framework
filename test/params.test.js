'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateParams } = require('../src');

test('coerces strings from the query string to declared types', () => {
  const { values, errors } = validateParams(
    { id: { type: 'integer' }, price: { type: 'number' }, live: { type: 'boolean' } },
    { id: '42', price: '9.5', live: 'true' },
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(values, { id: 42, price: 9.5, live: true });
});

test('applies defaults, reports missing required values and drops unknown keys', () => {
  const { values, errors } = validateParams(
    { page: { type: 'integer', default: 1 }, name: { type: 'string', required: true } },
    { extra: 'ignored' },
  );
  assert.deepEqual(values, { page: 1 });
  assert.deepEqual(errors, [{ param: 'name', message: 'name is required' }]);
});

test('enforces bounds, lengths, patterns, emails and enums', () => {
  const schema = {
    age: { type: 'integer', min: 18 },
    code: { type: 'string', pattern: '^[A-Z]{3}$' },
    bio: { type: 'string', maxLength: 5 },
    email: { type: 'email' },
    size: { type: 'enum', values: ['s', 'm', 'l'] },
  };
  const { errors } = validateParams(schema, { age: '17', code: 'abc', bio: 'too long', email: 'nope', size: 'xl' });
  assert.deepEqual(errors.map((e) => e.param), ['age', 'code', 'bio', 'email', 'size']);
});

test('rejects non-integers and normalizes emails', () => {
  assert.equal(validateParams({ id: { type: 'integer' } }, { id: '4.2' }).errors[0].message, 'id must be an integer');
  assert.equal(validateParams({ e: { type: 'email' } }, { e: ' A@B.co ' }).values.e, 'a@b.co');
});
