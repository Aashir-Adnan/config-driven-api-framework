'use strict';

const { createApp, DatabaseFactory, password } = require('../src');
const { apis } = require('./books.api');

const SCHEMA = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'reader'))
  );
  CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER,
    deleted_at TEXT
  );
`;

const BOOKS = [
  ['The Pragmatic Programmer', 'Hunt and Thomas', 1999],
  ['Designing Data-Intensive Applications', 'Kleppmann', 2017],
  ['Release It!', 'Nygard', 2007],
  ['Working Effectively with Legacy Code', 'Feathers', 2004],
  ['Database Internals', 'Petrov', 2019],
];

/** Builds the example app on a fresh in-memory SQLite database. */
async function buildExampleApp({ logger } = {}) {
  const db = DatabaseFactory.create({ driver: 'sqlite', filename: ':memory:' });
  await db.exec(SCHEMA);
  const users = [['admin@example.com', 'admin'], ['reader@example.com', 'reader']];
  for (const [email, role] of users) {
    await db.execute(
      'INSERT INTO users (email, password_hash, role) VALUES (:email, :hash, :role)',
      { email, hash: await password.hashPassword('correct-horse'), role },
    );
  }
  for (const [title, author, year] of BOOKS) {
    await db.execute('INSERT INTO books (title, author, year) VALUES (:title, :author, :year)', { title, author, year });
  }
  const app = createApp({
    apis,
    databases: { main: db },
    jwtSecret: process.env.JWT_SECRET || 'example-only-secret-change-me',
    logger,
  });
  return { app, db };
}

if (require.main === module) {
  buildExampleApp().then(({ app }) => {
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => console.log(`Example API on http://localhost:${port}  (GET /docs lists the routes)`));
  });
}

module.exports = { buildExampleApp };
