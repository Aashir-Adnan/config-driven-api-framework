'use strict';

/**
 * createApp(options) -> Express app
 *
 * Responsibility:
 *   Turn a list of API definitions into a running HTTP app. For every route
 *   it builds a pipeline once at startup, then per request it:
 *     1. picks the API version (header, defaulting to the latest registered),
 *     2. builds a request context (`ctx`),
 *     3. runs the pipeline steps in order, then the execute step,
 *     4. renders either a success envelope or a structured error.
 *
 * Options:
 *   databases           map of name -> database adapter; `main` is the default
 *   apis                array of defineApi() results
 *   jwtSecret           secret for signing and verifying tokens
 *   tokenTtlSeconds     lifetime for issued tokens
 *   resolvePermissions  optional (user, ctx) => string[] override
 *   logger              object with an error() method
 *
 * Public skeleton: interface only. See docs/architecture.md for the design.
 */
function createApp(options) {
  throw new Error('createApp: not implemented in the public skeleton');
}

module.exports = { createApp };
