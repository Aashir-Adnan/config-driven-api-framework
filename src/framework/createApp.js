'use strict';

const express = require('express');
const { ApiRegistry } = require('./registry');
const { ApiError, badRequest } = require('./errors');
const { authenticate } = require('./middlewares/authenticate');
const { authorize } = require('./middlewares/authorize');
const { validate } = require('./middlewares/validate');
const { execute } = require('./middlewares/execute');
const jwt = require('./auth/jwt');
const password = require('./auth/password');

/**
 * createApp(options) -> Express app
 *
 * Turns a list of API definitions into a running HTTP app. For every route
 * it builds a pipeline once at startup, then per request it:
 *   1. picks the API version (X-API-Version header, defaulting to the latest),
 *   2. builds a request context (`ctx`),
 *   3. runs the pipeline steps in order, then the execute step,
 *   4. renders either a success envelope or a structured error.
 *
 * Options:
 *   databases           map of name -> database adapter; `main` is the default
 *   apis                array of defineApi() results
 *   jwtSecret           secret for signing and verifying tokens (required)
 *   tokenTtlSeconds     lifetime for issued tokens (default 3600)
 *   resolvePermissions  optional (user, ctx) => string[] override
 *   services            extra objects exposed to handlers as ctx.services
 *   logger              object with an error() method (default console)
 *   docs                expose GET /docs with the route summary (default true)
 */
function buildPipeline(api, options) {
  const steps = [authenticate(options)];
  if (api.auth.permission) steps.push(authorize(options));
  steps.push(validate());
  return { steps, run: execute() };
}

function createApp(options = {}) {
  const {
    apis = [],
    databases = {},
    jwtSecret,
    tokenTtlSeconds = 3600,
    services = {},
    logger = console,
    docs = true,
  } = options;
  if (!jwtSecret) throw new Error('createApp: jwtSecret is required');

  const registry = new ApiRegistry(apis);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  const sharedServices = {
    issueToken: (claims) => jwt.sign(claims, jwtSecret, { expiresInSeconds: tokenTtlSeconds }),
    hashPassword: password.hashPassword,
    verifyPassword: password.verifyPassword,
    ...services,
  };

  if (docs) app.get('/docs', (req, res) => res.json({ success: true, data: registry.describe() }));

  for (const route of registry.routes.values()) {
    const pipelines = new Map(
      [...route.versions.entries()].map(([version, api]) => [version, buildPipeline(api, options)]),
    );

    app[route.method.toLowerCase()](route.path, async (req, res, next) => {
      try {
        const requested = req.get('X-API-Version');
        const version = requested || ApiRegistry.latest(route);
        const api = route.versions.get(version);
        if (!api) {
          throw badRequest(`Unsupported API version "${requested}"`, {
            supported: [...route.versions.keys()].sort((a, b) => Number(a) - Number(b)),
          });
        }
        const ctx = {
          req, api, version, user: null, params: {},
          db: databases[(api.query && api.query.database) || 'main'],
          databases, services: sharedServices,
        };
        const { steps, run } = pipelines.get(version);
        for (const step of steps) await step(ctx);
        const result = await run(ctx);
        res.set('X-API-Version', version);
        res.status(result.status).json({
          success: true,
          message: result.message,
          data: result.data,
          ...(result.meta ? { meta: result.meta } : {}),
        });
      } catch (error) {
        next(error);
      }
    });
  }

  app.use((req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No such route' } });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof ApiError) {
      return res.status(error.status).json({
        success: false,
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Malformed JSON body' } });
    }
    logger.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Something went wrong' } });
  });

  return app;
}

module.exports = { createApp };
