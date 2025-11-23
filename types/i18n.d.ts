// Type definitions for i18n translations
// This enables TypeScript autocomplete for translation keys

type Messages = typeof import('../messages/fr.json');

declare global {
  // Use type-safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

export {};
