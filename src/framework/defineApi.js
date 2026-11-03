'use strict';

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const MODES = new Set(['many', 'one', 'run']);

/**
 * Declares one version of one endpoint as plain data.
 *
 *   defineApi({
 *     name: 'books.get',            // unique together with `version`
 *     version: '1',
 *     method: 'GET',
 *     path: '/books/:id',
 *     auth: { required: true, permission: 'books:read' },
 *     params: { id: { type: 'integer', required: true, min: 1 } },
 *     query: { mode: 'one', sql: 'SELECT * FROM books WHERE id = :id' },
 *     response: { notFound: 'Book not found' },
 *   })
 *
 * Exactly one of `query` (declarative SQL) or `handler` (custom function) is
 * required. Definitions are validated up front so mistakes fail at startup
 * rather than on the first request.
 */
function defineApi(definition) {
  const api = { auth: { required: false }, params: {}, response: {}, ...definition };
  const label = `API "${api.name || '(unnamed)'}"`;

  if (typeof api.name !== 'string' || !api.name) throw new Error('Every API needs a name');
  if (typeof api.version !== 'string' || !/^\d+$/.test(api.version)) {
    throw new Error(`${label}: version must be a numeric string such as "1"`);
  }
  api.method = String(api.method || '').toUpperCase();
  if (!METHODS.has(api.method)) throw new Error(`${label}: unsupported method "${api.method}"`);
  if (typeof api.path !== 'string' || !api.path.startsWith('/')) {
    throw new Error(`${label}: path must start with "/"`);
  }

  const hasQuery = api.query !== undefined;
  const hasHandler = typeof api.handler === 'function';
  if (hasQuery === hasHandler) throw new Error(`${label}: provide exactly one of "query" or "handler"`);

  if (hasQuery) {
    const { mode, sql, build } = api.query;
    if (!MODES.has(mode)) throw new Error(`${label}: query.mode must be one of ${[...MODES].join(', ')}`);
    if (typeof sql !== 'string' && typeof build !== 'function') {
      throw new Error(`${label}: query needs "sql" or a "build" function`);
    }
  }

  if (api.auth.permission && !api.auth.required) {
    throw new Error(`${label}: a permission requires auth.required to be true`);
  }

  if (api.pagination) {
    if (!hasQuery || api.query.mode !== 'many') {
      throw new Error(`${label}: pagination only applies to query.mode "many"`);
    }
    const pageSize = api.pagination.pageSize ?? 10;
    const maxPageSize = api.pagination.maxPageSize ?? 100;
    api.params = {
      ...api.params,
      page: { type: 'integer', min: 1, default: 1 },
      pageSize: { type: 'integer', min: 1, max: maxPageSize, default: pageSize },
    };
  }

  return Object.freeze(api);
}

module.exports = { defineApi };
