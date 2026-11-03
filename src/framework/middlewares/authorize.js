'use strict';

/**
 * Pipeline step: authorize
 *
 * Enforces the endpoint's declared `auth.permission` for `ctx.user`.
 * Permissions come from the token claims by default, or from an injected
 * `resolvePermissions(user, ctx)` function (database, cache, policy service).
 *
 * Contract:   (ctx) => Promise<void>; throws ApiError 403 when not allowed.
 * Matching:   exact string, namespace wildcard ("books:*"), or global "*".
 *
 * Public skeleton: interface only.
 */
function authorize(options) {
  return async function authorizeStep(ctx) {
    throw new Error('authorize: not implemented in the public skeleton');
  };
}

module.exports = { authorize };
