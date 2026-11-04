'use strict';

/**
 * compileNamed(sql, params, placeholder) -> { text, values }
 *
 * Converts `:name` placeholders into driver placeholders and a positional
 * values array, so user input is always bound and never concatenated into SQL.
 * String literals, quoted identifiers and `::` casts are left alone.
 *
 * `placeholder` is either a string such as "?" or a function (index) => "$1".
 * A placeholder whose name is missing from `params` is a programming error and
 * throws, rather than silently binding undefined.
 */
function compileNamed(sql, params = {}, placeholder = '?') {
  const toPlaceholder = typeof placeholder === 'function' ? placeholder : () => placeholder;
  const values = [];
  let text = '';
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    // Copy quoted strings and identifiers through untouched ('...', "...", `...`).
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) { j += 2; continue; } // escaped quote ('')
          break;
        }
        j += 1;
      }
      text += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // PostgreSQL casts (::int) are not parameters.
    if (ch === ':' && sql[i + 1] === ':') {
      text += '::';
      i += 2;
      continue;
    }

    if (ch === ':' && /[A-Za-z_]/.test(sql[i + 1] || '')) {
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j])) j += 1;
      const name = sql.slice(i + 1, j);
      if (!Object.prototype.hasOwnProperty.call(params, name)) {
        throw new Error(`SQL parameter ":${name}" has no value`);
      }
      values.push(params[name]);
      text += toPlaceholder(values.length);
      i = j;
      continue;
    }

    text += ch;
    i += 1;
  }

  return { text, values };
}

module.exports = { compileNamed };
