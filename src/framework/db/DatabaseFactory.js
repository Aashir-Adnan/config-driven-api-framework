'use strict';

/**
 * Registry of database drivers, keyed by name.
 *
 *   DatabaseFactory.register('postgres', PostgresDatabase);
 *   const db = DatabaseFactory.create({ driver: 'postgres', ...connectionOptions });
 *
 * The bundled SQLite driver is registered as "sqlite" in src/index.js.
 */
class DatabaseFactory {
  static drivers = new Map();

  static register(name, DriverClass) {
    DatabaseFactory.drivers.set(name, DriverClass);
  }

  static create({ driver, ...options } = {}) {
    const DriverClass = DatabaseFactory.drivers.get(driver);
    if (!DriverClass) {
      const known = [...DatabaseFactory.drivers.keys()].join(', ') || '(none)';
      throw new Error(`Unknown database driver "${driver}". Registered drivers: ${known}`);
    }
    return new DriverClass(options);
  }
}

module.exports = { DatabaseFactory };
