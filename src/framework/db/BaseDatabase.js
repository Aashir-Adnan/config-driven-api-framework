'use strict';

/**
 * The contract every database adapter implements. The rest of the framework
 * only talks to this interface, so adding MySQL or PostgreSQL means writing
 * one subclass and registering it with DatabaseFactory.
 *
 *   query(sql, namedParams)      -> Promise<row[]>
 *   queryOne(sql, namedParams)   -> Promise<row | null>
 *   execute(sql, namedParams)    -> Promise<{ changes, lastInsertId }>
 *   transaction(work)            -> Promise<result>   commit on success, roll back on throw
 *   close()                      -> Promise<void>
 *
 * SQL uses `:name` placeholders in every adapter.
 */
class BaseDatabase {
  async query(sql, params = {}) {
    throw new Error(`${this.constructor.name} must implement query()`);
  }

  async queryOne(sql, params = {}) {
    throw new Error(`${this.constructor.name} must implement queryOne()`);
  }

  async execute(sql, params = {}) {
    throw new Error(`${this.constructor.name} must implement execute()`);
  }

  async transaction(work) {
    throw new Error(`${this.constructor.name} must implement transaction()`);
  }

  async close() {}
}

module.exports = { BaseDatabase };
