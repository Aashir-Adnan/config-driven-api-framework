'use strict';

const crypto = require('node:crypto');

/**
 * Minimal HS256 JSON Web Tokens.
 *
 *   sign(payload, secret, { expiresInSeconds }) -> string
 *   verify(token, secret)                       -> claims, or throws
 *
 * The algorithm is pinned (a token claiming any other "alg", including
 * "none", is rejected), signatures are compared in constant time, and expiry
 * is always checked. In a production service prefer a maintained library.
 */
const HEADER = { alg: 'HS256', typ: 'JWT' };

const b64url = (input) => Buffer.from(input).toString('base64url');
const fromB64url = (input) => Buffer.from(input, 'base64url').toString('utf8');
const hmac = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenError';
  }
}

function sign(payload, secret, { expiresInSeconds = 3600, now = Date.now() } = {}) {
  if (!secret) throw new Error('sign: a secret is required');
  const iat = Math.floor(now / 1000);
  const body = { ...payload, iat, exp: iat + expiresInSeconds };
  const unsigned = `${b64url(JSON.stringify(HEADER))}.${b64url(JSON.stringify(body))}`;
  return `${unsigned}.${hmac(unsigned, secret)}`;
}

function verify(token, secret, { now = Date.now() } = {}) {
  if (!secret) throw new Error('verify: a secret is required');
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new TokenError('Malformed token');
  const [headerPart, payloadPart, signature] = parts;

  let header;
  let claims;
  try {
    header = JSON.parse(fromB64url(headerPart));
    claims = JSON.parse(fromB64url(payloadPart));
  } catch {
    throw new TokenError('Malformed token');
  }
  if (header.alg !== HEADER.alg) throw new TokenError('Unsupported token algorithm');

  const expected = Buffer.from(hmac(`${headerPart}.${payloadPart}`, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new TokenError('Invalid token signature');
  }
  if (typeof claims.exp !== 'number' || Math.floor(now / 1000) >= claims.exp) {
    throw new TokenError('Token expired');
  }
  return claims;
}

module.exports = { sign, verify, TokenError };
