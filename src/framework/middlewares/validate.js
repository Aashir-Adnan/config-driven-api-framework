'use strict';

/**
 * Pipeline step: validate
 *
 * Merges request input (path > body > query), validates and coerces it
 * against the endpoint's declared `params`, and stores the clean result on
 * `ctx.params`. Undeclared input never reaches handlers or queries.
 *
 * Contract:   (ctx) => Promise<void>; throws ApiError 422 with per-field details.
 *
 * Public skeleton: interface only.
 */
function validate() {
  return async function validateStep(ctx) {
    throw new Error('validate: not implemented in the public skeleton');
  };
}

module.exports = { validate };
