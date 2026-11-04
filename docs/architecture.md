# Architecture

This document explains how the framework is structured and why. The framework is implemented and tested; see the README for a runnable example and test/demo commands.

## 1. Goals

1. Make the common case (a CRUD-style or query-style endpoint) a short declaration.
2. Keep cross-cutting concerns (auth, permissions, validation, versioning, pagination) in one place so they are consistent and testable.
3. Stay out of the way: any endpoint can drop to a custom handler.
4. Keep storage swappable.

## 2. The API definition

A definition is a frozen plain object produced by `defineApi`.

| Field | Meaning |
|---|---|
| `name` | Unique label together with `version`, used in docs and logs |
| `version` | Numeric string such as `"1"` |
| `method`, `path` | HTTP method and Express-style path (`/books/:id`) |
| `auth` | `{ required, permission }`; a permission requires `required: true` |
| `params` | Rules for each accepted parameter (type, required, default, min/max, pattern, enum values) |
| `pagination` | `{ pageSize, maxPageSize }`; adds `page` and `pageSize` parameters automatically |
| `query` | Declarative SQL: `{ mode, sql }` or `{ mode, build(ctx) }`, optional `database` name |
| `handler` | Custom `async (ctx) => { data, message?, status?, meta? }`; mutually exclusive with `query` |
| `response` | `{ status, message, notFound, requireChanges, transform }` |

`defineApi` validates the shape immediately, so a typo fails when the server starts.

### Query modes

- `many`: returns rows, with optional pagination and a `meta` block (`page`, `pageSize`, `total`, `totalPages`).
- `one`: returns one row, or a 404 using `response.notFound`.
- `run`: a write; returns `{ changes, lastInsertId }`, and can 404 when nothing changed.

## 3. Registry and versioning

`ApiRegistry` groups definitions by `METHOD path`. One Express route is registered per group, and a small dispatcher picks the version per request:

1. read the `X-API-Version` header,
2. fall back to the highest registered version,
3. answer `400` with the supported versions if the requested one does not exist.

Because versions share a route, adding `v2` of an endpoint never touches `v1`.

## 4. The request context

Each request gets a context object that steps read and write:

```
ctx = { req, api, version, user, params, db, databases, services }
```

`authenticate` sets `user`, `validate` sets `params`, and `execute` uses `db` and `params`. Passing a context rather than chaining Express middleware keeps steps small, unit-testable without HTTP, and independent of one another.

## 5. Pipeline steps

Steps run in a fixed order and each can end the request by throwing an `ApiError`.

1. **authenticate** sets `ctx.user` from a bearer token. Required endpoints reject bad tokens (401); public endpoints ignore them.
2. **authorize** matches `auth.permission` against the user's permissions. Matching supports exact values, namespace wildcards (`books:*`) and a global wildcard. Permissions come from the token or an injected resolver.
3. **validate** merges input with a fixed precedence (path over body over query, so a client cannot override a path parameter via the query string), validates and coerces it, and discards undeclared keys. Failures return `422` with one entry per field.
4. **execute** runs the query or handler and wraps the result.

A step is omitted from a given endpoint's pipeline when it cannot apply.

## 6. Database layer

`BaseDatabase` defines `query`, `queryOne`, `execute`, `transaction` and `close`. SQL is written with `:name` placeholders in every adapter; a small compiler turns them into the driver's style (`?`, `$1`, ...) plus an ordered values array. Values are always bound, never interpolated.

`DatabaseFactory` maps driver names to classes, so supporting a new database is one subclass and one `register` call. An endpoint can name which configured database it uses; `main` is the default.

## 7. Responses and errors

Success:

```json
{ "success": true, "message": "Books retrieved", "data": [], "meta": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 1 } }
```

Error:

```json
{ "success": false, "error": { "code": "VALIDATION_FAILED", "message": "Request validation failed", "details": [{ "param": "id", "message": "id must be an integer" }] } }
```

Unexpected errors are logged server-side and returned as a generic `500` without internals.

## 8. Extension points

- **Custom handlers** for logic that does not fit a query.
- **`query.build(ctx)`** for dynamic SQL while keeping values bound.
- **`resolvePermissions`** to source permissions from a database or policy service.
- **Database drivers** through the factory.
- **`response.transform`** to reshape or enrich results.

## 9. Trade-offs

- SQL lives in definitions. That is quick to write and easy to audit, but large queries are better extracted into a module and referenced from `build`.
- A fixed pipeline order is easy to reason about but not reorderable per endpoint. If that is needed, steps could become a declared list.
- Versioning by header is simple for API clients but less visible than a path prefix; a path-based strategy would be a small change in the dispatcher.
