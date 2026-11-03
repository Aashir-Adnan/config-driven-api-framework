'use strict';

/**
 * Pipeline step: authenticate
 *
 * Reads a bearer token from the request and, when valid, sets `ctx.user` to
 * the decoded claims.
 *
 * Contract:   (ctx) => Promise<void>
 * Behaviour:  endpoints with `auth.required` reject a missing or invalid
 *             token with ApiError 401; public endpoints ignore a bad token.
 *
 * Public skeleton: interface only.
 */
function authenticate(options) {
  return async function authenticateStep(ctx) {
    throw new Error('authenticate: not implemented in the public skeleton');
  };
}

module.exports = { authenticate };
