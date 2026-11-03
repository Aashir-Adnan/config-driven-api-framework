'use strict';

/**
 * Groups API definitions by `METHOD path`. Several versions of the same
 * endpoint share one route; the version is chosen per request.
 */
class ApiRegistry {
  constructor(apis = []) {
    this.routes = new Map();
    apis.forEach((api) => this.register(api));
  }

  register(api) {
    const key = `${api.method} ${api.path}`;
    const route = this.routes.get(key) || { method: api.method, path: api.path, versions: new Map() };
    if (route.versions.has(api.version)) {
      throw new Error(`Duplicate API for ${key} at version ${api.version}`);
    }
    route.versions.set(api.version, api);
    this.routes.set(key, route);
    return this;
  }

  /** Highest numeric version registered for a route. */
  static latest(route) {
    return [...route.versions.keys()].sort((a, b) => Number(b) - Number(a))[0];
  }

  /** A JSON-friendly summary used by the /docs endpoint. */
  describe() {
    return [...this.routes.values()].map((route) => ({
      method: route.method,
      path: route.path,
      latestVersion: ApiRegistry.latest(route),
      versions: [...route.versions.values()]
        .sort((a, b) => Number(a.version) - Number(b.version))
        .map((api) => ({
          version: api.version,
          name: api.name,
          auth: api.auth.required ? { required: true, permission: api.auth.permission ?? null } : { required: false },
          params: api.params,
          paginated: Boolean(api.pagination),
        })),
    }));
  }
}

module.exports = { ApiRegistry };
