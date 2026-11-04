'use strict';

const { forbidden } = require('../errors');

/**
 * Pipeline step: authorize
 *
 * Enforces the endpoint's declared `auth.permission` for `ctx.user`.
 * Permissions come from the token's `permissions` claim by default, or from
 * an injected `resolvePermissions(user, ctx)` (database, cache, policy service).
 * Matching: exact string, namespace wildcard ("books:*"), or global "*".
 */
function permits(granted, required) {
  const namespace = required.includes(':') ? required.slice(0, required.indexOf(':')) : null;
  return granted.some((p) => p === '*' || p === required || (namespace && p === `${namespace}:*`));
}

function authorize({ resolvePermissions } = {}) {
  return async function authorizeStep(ctx) {
    const required = ctx.api.auth.permission;
    if (!required) return;
    const granted = resolvePermissions
      ? await resolvePermissions(ctx.user, ctx)
      : ctx.user?.permissions;
    if (!Array.isArray(granted) || !permits(granted, required)) {
      throw forbidden(`Missing permission: ${required}`);
    }
  };
}

module.exports = { authorize, permits };
