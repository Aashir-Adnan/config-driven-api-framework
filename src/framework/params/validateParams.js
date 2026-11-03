'use strict';

/**
 * validateParams(schema, input) -> { values, errors }
 *
 * Parameter rule shape (what an API definition's `params` accepts):
 *   { type, required, default, min, max, minLength, maxLength, pattern, values }
 * Types: string, integer, number, boolean, email, enum.
 *
 * Unknown input keys are dropped; `errors` is an array of { param, message }.
 *
 * Public skeleton: interface only.
 */
function validateParams(schema, input) {
  throw new Error('validateParams: not implemented in the public skeleton');
}

module.exports = { validateParams };
