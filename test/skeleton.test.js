'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, DatabaseFactory } = require('../src');

test('unimplemented parts say so clearly', () => {
  assert.throws(() => createApp({}), /not implemented in the public skeleton/);
});

test('the database factory reports unknown drivers', () => {
  assert.throws(() => DatabaseFactory.create({ driver: 'nope' }), /Unknown database driver "nope"/);
});

test('drivers can be registered and created', () => {
  class FakeDatabase {
    constructor(options) {
      this.options = options;
    }
  }
  DatabaseFactory.register('fake', FakeDatabase);
  const db = DatabaseFactory.create({ driver: 'fake', host: 'h' });
  assert.ok(db instanceof FakeDatabase);
  assert.equal(db.options.host, 'h');
});
