'use strict';

const { BaseDatabase } = require('./BaseDatabase');

/**
 * Example adapter showing how a driver plugs into the framework.
 * Public skeleton: no driver logic is included.
 */
class SqliteDatabase extends BaseDatabase {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}

module.exports = { SqliteDatabase };
