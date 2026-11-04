'use strict';

const { validateParams } = require('../params/validateParams');
const { unprocessable } = require('../errors');

/**
 * Pipeline step: validate
 *
 * Merges request input with a fixed precedence (path over body over query,
 * so a client cannot override a path parameter from the query string),
 * validates and coerces it against the endpoint's declared `params`, and
 * stores the clean result on `ctx.params`. Undeclared input never reaches
 * handlers or queries.
 */
function validate() {
  return async function validateStep(ctx) {
    const body = ctx.req.body && typeof ctx.req.body === 'object' && !Array.isArray(ctx.req.body) ? ctx.req.body : {};
    const input = { ...ctx.req.query, ...body, ...ctx.req.params };
    const { values, errors } = validateParams(ctx.api.params, input);
    if (errors.length) throw unprocessable(errors);
    ctx.params = values;
  };
}

module.exports = { validate };
