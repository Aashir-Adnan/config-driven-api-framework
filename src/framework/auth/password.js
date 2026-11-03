'use strict';

/**
 * Password hashing helpers (interface only in the public skeleton).
 *
 *   hashPassword(password)          -> Promise<string>   salted, memory-hard hash
 *   verifyPassword(password, hash)  -> Promise<boolean>  constant-time compare
 */
async function hashPassword(password) {
  throw new Error('hashPassword: not implemented in the public skeleton');
}

async function verifyPassword(password, stored) {
  throw new Error('verifyPassword: not implemented in the public skeleton');
}

module.exports = { hashPassword, verifyPassword };
