'use strict';

/**
 * validateParams(schema, input) -> { values, errors }
 *
 * Parameter rule shape (what an API definition's `params` accepts):
 *   { type, required, default, min, max, minLength, maxLength, pattern, values }
 * Types: string, integer, number, boolean, email, enum.
 *
 * Values arriving as strings (query string, path) are coerced to the declared
 * type. Unknown input keys are dropped. `errors` is an array of { param, message }.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isMissing = (v) => v === undefined || v === null || v === '';

function coerce(name, rule, raw) {
  const type = rule.type || 'string';
  switch (type) {
    case 'string':
    case 'email': {
      if (typeof raw !== 'string' && typeof raw !== 'number') return { error: `${name} must be a string` };
      const value = String(raw).trim();
      if (type === 'email' && !EMAIL.test(value)) return { error: `${name} must be a valid email address` };
      return { value: type === 'email' ? value.toLowerCase() : value };
    }
    case 'integer': {
      const value = typeof raw === 'number' ? raw : /^-?\d+$/.test(String(raw).trim()) ? Number(raw) : NaN;
      if (!Number.isInteger(value)) return { error: `${name} must be an integer` };
      return { value };
    }
    case 'number': {
      const value = typeof raw === 'number' ? raw : String(raw).trim() === '' ? NaN : Number(raw);
      if (!Number.isFinite(value)) return { error: `${name} must be a number` };
      return { value };
    }
    case 'boolean': {
      if (typeof raw === 'boolean') return { value: raw };
      const text = String(raw).toLowerCase();
      if (['true', '1', 'yes'].includes(text)) return { value: true };
      if (['false', '0', 'no'].includes(text)) return { value: false };
      return { error: `${name} must be true or false` };
    }
    case 'enum': {
      const value = String(raw);
      if (!Array.isArray(rule.values) || !rule.values.map(String).includes(value)) {
        return { error: `${name} must be one of: ${(rule.values || []).join(', ')}` };
      }
      return { value: rule.values.find((v) => String(v) === value) };
    }
    default:
      throw new Error(`Unknown parameter type "${type}" for ${name}`);
  }
}

function checkBounds(name, rule, value) {
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) return `${name} must be at least ${rule.min}`;
    if (rule.max !== undefined && value > rule.max) return `${name} must be at most ${rule.max}`;
  }
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return `${name} needs at least ${rule.minLength} characters`;
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return `${name} allows at most ${rule.maxLength} characters`;
    }
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) return `${name} has an invalid format`;
  }
  return null;
}

function validateParams(schema = {}, input = {}) {
  const values = {};
  const errors = [];

  for (const [name, rule] of Object.entries(schema)) {
    const raw = input[name];
    if (isMissing(raw)) {
      if (rule.default !== undefined) values[name] = rule.default;
      else if (rule.required) errors.push({ param: name, message: `${name} is required` });
      continue;
    }
    const { value, error } = coerce(name, rule, raw);
    if (error) { errors.push({ param: name, message: error }); continue; }
    const boundsError = checkBounds(name, rule, value);
    if (boundsError) { errors.push({ param: name, message: boundsError }); continue; }
    values[name] = value;
  }

  return { values, errors };
}

module.exports = { validateParams };
