'use strict';

const { defineApi, unauthorized } = require('../src');

/**
 * Endpoints for the example bookshelf, declared as data. Nothing here parses
 * tokens, validates input or binds SQL values by hand; the pipeline does.
 */

// Sign in: a custom handler, because it needs password checks and token issuing.
const login = defineApi({
  name: 'auth.login',
  version: '1',
  method: 'POST',
  path: '/auth/login',
  params: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 8 },
  },
  handler: async ({ params, db, services }) => {
    const user = await db.queryOne(
      'SELECT id, email, password_hash, role FROM users WHERE email = :email',
      { email: params.email },
    );
    if (!user || !(await services.verifyPassword(params.password, user.password_hash))) {
      throw unauthorized('Wrong email or password');
    }
    const permissions = user.role === 'admin' ? ['books:*'] : ['books:read'];
    return {
      status: 200,
      message: 'Signed in',
      data: { token: services.issueToken({ sub: user.id, email: user.email, permissions }) },
    };
  },
});

// Version 1: simple paginated list.
const listBooksV1 = defineApi({
  name: 'books.list',
  version: '1',
  method: 'GET',
  path: '/books',
  auth: { required: true, permission: 'books:read' },
  pagination: { pageSize: 10, maxPageSize: 100 },
  query: {
    mode: 'many',
    sql: 'SELECT id, title, author, year FROM books WHERE deleted_at IS NULL ORDER BY id',
  },
  response: { message: 'Books retrieved' },
});

// Version 2: adds optional search without breaking v1 clients.
const listBooksV2 = defineApi({
  name: 'books.list',
  version: '2',
  method: 'GET',
  path: '/books',
  auth: { required: true, permission: 'books:read' },
  params: { search: { type: 'string', maxLength: 100 } },
  pagination: { pageSize: 10, maxPageSize: 100 },
  query: {
    mode: 'many',
    build: (ctx) => ({
      sql: `SELECT id, title, author, year FROM books
            WHERE deleted_at IS NULL
              AND (:search IS NULL OR title LIKE :search)
            ORDER BY id`,
      params: { search: ctx.params.search ? `%${ctx.params.search}%` : null },
    }),
  },
  response: { message: 'Books retrieved' },
});

// A single record, with a declared 404 message.
const getBook = defineApi({
  name: 'books.get',
  version: '1',
  method: 'GET',
  path: '/books/:id',
  auth: { required: true, permission: 'books:read' },
  params: { id: { type: 'integer', required: true, min: 1 } },
  query: {
    mode: 'one',
    sql: 'SELECT id, title, author, year FROM books WHERE id = :id AND deleted_at IS NULL',
  },
  response: { notFound: 'Book not found' },
});

// A write, reshaped by response.transform.
const createBook = defineApi({
  name: 'books.create',
  version: '1',
  method: 'POST',
  path: '/books',
  auth: { required: true, permission: 'books:write' },
  params: {
    title: { type: 'string', required: true, minLength: 2, maxLength: 200 },
    author: { type: 'string', required: true, maxLength: 120 },
    year: { type: 'integer', min: 1450, max: 2100 },
  },
  query: {
    mode: 'run',
    sql: 'INSERT INTO books (title, author, year) VALUES (:title, :author, :year)',
  },
  response: { message: 'Book created', transform: (result) => ({ id: result.lastInsertId }) },
});

// Soft delete; 404 when nothing matched.
const deleteBook = defineApi({
  name: 'books.delete',
  version: '1',
  method: 'DELETE',
  path: '/books/:id',
  auth: { required: true, permission: 'books:write' },
  params: { id: { type: 'integer', required: true, min: 1 } },
  query: {
    mode: 'run',
    sql: "UPDATE books SET deleted_at = datetime('now') WHERE id = :id AND deleted_at IS NULL",
  },
  response: {
    message: 'Book deleted',
    requireChanges: true,
    notFound: 'Book not found',
    transform: (result, ctx) => ({ deleted: ctx.params.id }),
  },
});

module.exports = { apis: [login, listBooksV1, listBooksV2, getBook, createBook, deleteBook] };
