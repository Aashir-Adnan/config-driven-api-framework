'use strict';

const { defineApi } = require('./framework/defineApi');
const { ApiRegistry } = require('./framework/registry');
const { createApp } = require('./framework/createApp');
const { BaseDatabase } = require('./framework/db/BaseDatabase');
const { DatabaseFactory } = require('./framework/db/DatabaseFactory');
const { SqliteDatabase } = require('./framework/db/SqliteDatabase');
const { compileNamed } = require('./framework/db/namedParams');
const { validateParams } = require('./framework/params/validateParams');
const jwt = require('./framework/auth/jwt');
const password = require('./framework/auth/password');
const errors = require('./framework/errors');

DatabaseFactory.register('sqlite', SqliteDatabase);

module.exports = {
  defineApi, ApiRegistry, createApp,
  BaseDatabase, DatabaseFactory, SqliteDatabase, compileNamed,
  validateParams, jwt, password,
  ...errors,
};
