'use strict';

/**
 * compileNamed(sql, params, placeholder) -> { text, values }
 *
 * Converts `:name` placeholders into driver placeholders and a positional
 * values array, so user input is always bound and never concatenated into SQL.
 * String literals and `::` casts are left alone.
 *
 * Public skeleton: interface only.
 */
function compileNamed(sql, params, placeholder) {
  throw new Error('compileNamed: not implemented in the public skeleton');
}

module.exports = { compileNamed };
