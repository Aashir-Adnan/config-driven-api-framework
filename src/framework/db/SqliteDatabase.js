'use strict';

const { DatabaseSync } = require('node:sqlite');
const { BaseDatabase } = require('./BaseDatabase');
const { compileNamed } = require('./namedParams');

/**
 * SQLite adapter built on Node's bundled `node:sqlite` module, so the
 * framework runs with no native dependencies. Options: { filename } where
 * ":memory:" (the default) gives a throwaway database.
 */
class SqliteDatabase extends BaseDatabase {
  constructor(options = {}) {
    super();
    this.options = { filename: ':memory:', ...options };
    this.db = new DatabaseSync(this.options.filename);
  }

  #prepare(sql, params) {
    const { text, values } = compileNamed(sql, params, '?');
    // SQLite has no boolean type; bind true/false as 1/0.
    const bound = values.map((v) => (typeof v === 'boolean' ? Number(v) : v === undefined ? null : v));
    return { statement: this.db.prepare(text), bound };
  }

  async query(sql, params = {}) {
    const { statement, bound } = this.#prepare(sql, params);
    return statement.all(...bound).map((row) => ({ ...row }));
  }

  async queryOne(sql, params = {}) {
    const { statement, bound } = this.#prepare(sql, params);
    const row = statement.get(...bound);
    return row ? { ...row } : null;
  }

  async execute(sql, params = {}) {
    const { statement, bound } = this.#prepare(sql, params);
    const result = statement.run(...bound);
    return { changes: Number(result.changes), lastInsertId: Number(result.lastInsertRowid) };
  }

  /** Runs raw SQL with no parameters, e.g. a schema file. */
  async exec(sql) {
    this.db.exec(sql);
  }

  async transaction(work) {
    this.db.exec('BEGIN');
    try {
      const result = await work(this);
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async close() {
    this.db.close();
  }
}

module.exports = { SqliteDatabase };
