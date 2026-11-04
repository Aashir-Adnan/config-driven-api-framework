'use strict';

const { notFound } = require('../errors');

/**
 * Final pipeline step: execute
 *
 * Runs the endpoint's `handler`, or its declarative `query`, and returns a
 * normalized result: { status, message, data, meta }.
 *
 * Query modes:
 *   many  -> array of rows (optionally paginated, with `meta`)
 *   one   -> a single row, or 404 when absent
 *   run   -> write statement; returns { changes, lastInsertId }
 */
function resolveSql(ctx) {
  const { sql, build } = ctx.api.query;
  // Every declared parameter is bindable; optional ones the client left out bind as NULL.
  const declared = Object.fromEntries(Object.keys(ctx.api.params || {}).map((name) => [name, null]));
  const params = { ...declared, ...ctx.params };
  if (build) {
    const built = build(ctx);
    return { sql: built.sql, params: { ...params, ...(built.params || {}) } };
  }
  return { sql, params };
}

async function runQuery(ctx) {
  const { api } = ctx;
  const db = ctx.databases[api.query.database || 'main'];
  if (!db) throw new Error(`API "${api.name}": database "${api.query.database || 'main'}" is not configured`);
  const { sql, params } = resolveSql(ctx);
  const response = api.response || {};

  if (api.query.mode === 'many') {
    if (!api.pagination) return { data: await db.query(sql, params) };
    const { page, pageSize } = ctx.params;
    const base = sql.trim().replace(/;$/, '');
    const countRow = await db.queryOne(`SELECT COUNT(*) AS total FROM (${base}) AS counted`, params);
    const total = Number(countRow?.total ?? 0);
    const data = await db.query(`${base} LIMIT :__limit OFFSET :__offset`, {
      ...params, __limit: pageSize, __offset: (page - 1) * pageSize,
    });
    return { data, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  if (api.query.mode === 'one') {
    const row = await db.queryOne(sql, params);
    if (!row) throw notFound(response.notFound);
    return { data: row };
  }

  const result = await db.execute(sql, params);
  if (response.requireChanges && result.changes === 0) throw notFound(response.notFound);
  return { data: result };
}

function execute() {
  return async function executeStep(ctx) {
    const { api } = ctx;
    const response = api.response || {};
    const outcome = api.handler ? (await api.handler(ctx)) || {} : await runQuery(ctx);
    let data = outcome.data;
    if (typeof response.transform === 'function') data = await response.transform(data, ctx);
    return {
      status: outcome.status || response.status || (api.method === 'POST' ? 201 : 200),
      message: outcome.message || response.message || 'OK',
      data: data === undefined ? null : data,
      ...(outcome.meta ? { meta: outcome.meta } : {}),
    };
  };
}

module.exports = { execute };
