'use strict';

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
 *
 * Contract:   (ctx) => Promise<{ status, message, data, meta? }>
 *
 * Public skeleton: interface only.
 */
function execute() {
  return async function executeStep(ctx) {
    throw new Error('execute: not implemented in the public skeleton');
  };
}

module.exports = { execute };
