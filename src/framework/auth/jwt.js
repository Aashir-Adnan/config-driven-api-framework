'use strict';

/**
 * Token helpers (interface only in the public skeleton).
 *
 *   sign(payload, secret, { expiresInSeconds }) -> string
 *   verify(token, secret)                       -> claims, or throws
 *
 * Design notes: the algorithm is pinned (no "alg: none"), signatures are
 * compared in constant time, and expiry is always checked. In a real service
 * prefer a maintained library for this.
 */
function sign(payload, secret, options) {
  throw new Error('sign: not implemented in the public skeleton');
}

function verify(token, secret, options) {
  throw new Error('verify: not implemented in the public skeleton');
}

module.exports = { sign, verify };
