'use strict';

const { verify } = require('../auth/jwt');
const { unauthorized } = require('../errors');

/**
 * Pipeline step: authenticate
 *
 * Reads a bearer token from the request and, when valid, sets `ctx.user` to
 * the decoded claims. Endpoints with `auth.required` reject a missing or
 * invalid token with 401; public endpoints ignore a bad token.
 */
function authenticate({ jwtSecret } = {}) {
  return async function authenticateStep(ctx) {
    const header = ctx.req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    const required = Boolean(ctx.api.auth.required);

    if (!match) {
      if (required) throw unauthorized();
      return;
    }
    try {
      ctx.user = verify(match[1].trim(), jwtSecret);
    } catch (error) {
      if (required) throw unauthorized(error.message);
    }
  };
}

module.exports = { authenticate };
