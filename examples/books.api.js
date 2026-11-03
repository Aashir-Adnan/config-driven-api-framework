'use strict';

const { defineApi } = require('../src');

/**
 * Two versions of the same endpoint, declared as data. Nothing here parses
 * tokens, validates input or touches the database directly; the pipeline does.
 */

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

module.exports = { apis: [listBooksV1, listBooksV2, getBook] };
