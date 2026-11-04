'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { compileNamed, DatabaseFactory, SqliteDatabase } = require('../src');

test('compileNamed binds values in order and reuses repeated names', () => {
  const { text, values } = compileNamed('SELECT * FROM t WHERE a = :a OR (:b IS NULL AND a = :a)', { a: 1, b: null });
  assert.equal(text, 'SELECT * FROM t WHERE a = ? OR (? IS NULL AND a = ?)');
  assert.deepEqual(values, [1, null, 1]);
});

test('compileNamed supports numbered placeholders', () => {
  const { text } = compileNamed('SELECT :x, :y', { x: 1, y: 2 }, (i) => `$${i}`);
  assert.equal(text, 'SELECT $1, $2');
});

test('compileNamed leaves string literals and casts alone', () => {
  const { text, values } = compileNamed("SELECT ':not_a_param', 'it''s', id::text FROM t WHERE id = :id", { id: 5 });
  assert.equal(text, "SELECT ':not_a_param', 'it''s', id::text FROM t WHERE id = ?");
  assert.deepEqual(values, [5]);
});

test('compileNamed refuses a placeholder with no value', () => {
  assert.throws(() => compileNamed('SELECT :missing', {}), /":missing" has no value/);
});

test('the factory knows the bundled sqlite driver', () => {
  assert.ok(DatabaseFactory.create({ driver: 'sqlite' }) instanceof SqliteDatabase);
  assert.throws(() => DatabaseFactory.create({ driver: 'nope' }), /Unknown database driver "nope"/);
});

test('sqlite adapter: query, queryOne, execute and transactions', async () => {
  const db = new SqliteDatabase();
  await db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT, flag INTEGER)');
  const inserted = await db.execute('INSERT INTO t (name, flag) VALUES (:name, :flag)', { name: 'a', flag: true });
  assert.deepEqual(inserted, { changes: 1, lastInsertId: 1 });
  assert.deepEqual(await db.queryOne('SELECT name, flag FROM t WHERE id = :id', { id: 1 }), { name: 'a', flag: 1 });
  assert.equal(await db.queryOne('SELECT * FROM t WHERE id = :id', { id: 99 }), null);

  await assert.rejects(db.transaction(async (tx) => {
    await tx.execute('INSERT INTO t (name) VALUES (:name)', { name: 'rolled back' });
    throw new Error('boom');
  }), /boom/);
  assert.equal((await db.query('SELECT * FROM t')).length, 1);
  await db.close();
});
