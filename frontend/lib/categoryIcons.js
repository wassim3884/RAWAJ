// Fallback icon shown for a category until an admin uploads a real photo via
// Admin → التصنيفات (categories.icon_url in the database). Keyed by the
// existing category slugs seeded in backend/src/db/seed.js — add an entry
// here whenever a new slug is created so it never falls back to the blank
// placeholder.
export const CATEGORY_FALLBACK_ICON = {
  clothing: '👕',
  sports: '🏋️',
  seasonal: '🎁',
  electronics: '🔌',
  'home-garden': '🪴',
  'beauty-health': '💄',
  'toys-kids': '🧸',
  accessories: '👜',
};
