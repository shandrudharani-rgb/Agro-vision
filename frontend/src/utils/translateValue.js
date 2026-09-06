// Converts API/database display values to a stable locale key.  Database values
// remain unchanged; this is deliberately applied only when rendering.
export const valueKey = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

export const translateValue = (t, value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback ?? '';
  const original = fallback ?? String(value);
  const key = `value.${valueKey(value)}`;
  const translated = t(key, undefined);
  if (translated !== key) return translated;
  // Dynamic database/API values always fall back to their original value.
  // This prevents a locale key, undefined, or an error message reaching UI.
  return original;
};

// Use a category at render sites whenever the API field has known semantics.
// It makes translations explicit (for example cropNames.Rice) while retaining
// the generic value map for existing data variants.
export const translateCategory = (t, category, value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback ?? '';
  const normalized = valueKey(value);
  return t(`${category}.${value}`, t(`${category}.${normalized}`, translateValue(t, value, fallback)));
};

export const translateList = (t, values, fallback) =>
  Array.isArray(values) ? values.map((value) => translateValue(t, value, fallback)).join(', ') : translateValue(t, values, fallback);
