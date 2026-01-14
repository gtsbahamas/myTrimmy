/**
 * i18n Shared Types & Utilities - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * Shared types and client-safe functions for internationalization.
 * This module contains no server-only imports and can be used by both
 * server and client code.
 */

// ============================================================
// SUPPORTED LOCALES
// ============================================================

export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'zh'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  de: 'Deutsch',
  ja: 'Japanese',
  zh: 'Chinese',
};

// ============================================================
// TRANSLATION KEY TYPES
// ============================================================

/**
 * All translation keys organized by namespace.
 * Add new keys here to get type-safe translations.
 */
export interface TranslationKeys {
  // Authentication
  'auth.signIn': string;
  'auth.signUp': string;
  'auth.signOut': string;
  'auth.email': string;
  'auth.password': string;
  'auth.forgotPassword': string;
  'auth.resetPassword': string;
  'auth.confirmEmail': string;
  'auth.createAccount': string;
  'auth.alreadyHaveAccount': string;
  'auth.dontHaveAccount': string;
  'auth.rememberMe': string;
  'auth.termsAgree': string;

  // Errors
  'error.generic': string;
  'error.notFound': string;
  'error.unauthorized': string;
  'error.forbidden': string;
  'error.validation': string;
  'error.network': string;
  'error.timeout': string;
  'error.serverError': string;
  'error.required': string;
  'error.invalidEmail': string;
  'error.invalidFormat': string;
  'error.tooShort': string;
  'error.tooLong': string;
  'error.passwordMismatch': string;
  'error.weakPassword': string;
  'error.emailTaken': string;
  'error.invalidCredentials': string;
  'error.sessionExpired': string;

  // Navigation
  'nav.home': string;
  'nav.dashboard': string;
  'nav.settings': string;
  'nav.profile': string;
  'nav.help': string;
  'nav.about': string;
  'nav.contact': string;
  'nav.back': string;
  'nav.next': string;
  'nav.previous': string;

  // Actions
  'action.save': string;
  'action.cancel': string;
  'action.delete': string;
  'action.edit': string;
  'action.create': string;
  'action.update': string;
  'action.submit': string;
  'action.confirm': string;
  'action.close': string;
  'action.open': string;
  'action.search': string;
  'action.filter': string;
  'action.sort': string;
  'action.refresh': string;
  'action.download': string;
  'action.upload': string;
  'action.copy': string;
  'action.share': string;
  'action.export': string;
  'action.import': string;
  'action.add': string;
  'action.remove': string;
  'action.retry': string;
  'action.continue': string;
  'action.skip': string;
  'action.done': string;
  'action.view': string;
  'action.viewAll': string;
  'action.showMore': string;
  'action.showLess': string;
  'action.selectAll': string;
  'action.deselectAll': string;

  // Common labels
  'common.loading': string;
  'common.processing': string;
  'common.success': string;
  'common.error': string;
  'common.warning': string;
  'common.info': string;
  'common.yes': string;
  'common.no': string;
  'common.ok': string;
  'common.or': string;
  'common.and': string;
  'common.all': string;
  'common.none': string;
  'common.total': string;
  'common.items': string;
  'common.page': string;
  'common.of': string;
  'common.to': string;
  'common.from': string;
  'common.optional': string;
  'common.required': string;
  'common.name': string;
  'common.description': string;
  'common.status': string;
  'common.type': string;
  'common.date': string;
  'common.time': string;
  'common.createdAt': string;
  'common.updatedAt': string;
  'common.noResults': string;
  'common.noData': string;
  'common.empty': string;

  // Confirmation dialogs
  'confirm.delete': string;
  'confirm.deleteDescription': string;
  'confirm.unsavedChanges': string;
  'confirm.unsavedChangesDescription': string;
  'confirm.logout': string;
  'confirm.logoutDescription': string;

  // Form labels
  'form.firstName': string;
  'form.lastName': string;
  'form.fullName': string;
  'form.email': string;
  'form.phone': string;
  'form.address': string;
  'form.city': string;
  'form.state': string;
  'form.country': string;
  'form.zipCode': string;
  'form.message': string;
  'form.subject': string;
  'form.comments': string;

  // Pluralization keys (use with count parameter)
  'plural.item': string;
  'plural.result': string;
  'plural.page': string;
  'plural.user': string;
  'plural.day': string;
  'plural.hour': string;
  'plural.minute': string;
  'plural.second': string;

}

export type TranslationKey = keyof TranslationKeys;

// ============================================================
// TRANSLATION FUNCTION TYPE
// ============================================================

interface TranslateOptions {
  /** Values to interpolate into the translation */
  readonly values?: Record<string, string | number>;
  /** Count for pluralization */
  readonly count?: number;
  /** Default value if key not found */
  readonly defaultValue?: string;
}

/**
 * Type-safe translation function.
 */
export interface TranslateFunction {
  (key: TranslationKey, options?: TranslateOptions): string;
}

// ============================================================
// LANGUAGE DETECTION (CLIENT-SAFE)
// ============================================================

/**
 * Detect user's preferred locale from browser settings.
 * For use in client components.
 */
export function detectBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // Check navigator.language
  const browserLang = navigator.language?.split('-')[0];
  if (browserLang && isValidLocale(browserLang)) {
    return browserLang;
  }

  // Check navigator.languages
  for (const lang of navigator.languages || []) {
    const langCode = lang.split('-')[0];
    if (isValidLocale(langCode)) {
      return langCode;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Check if a string is a valid locale.
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

// ============================================================
// DATE & NUMBER FORMATTING
// ============================================================

/**
 * Format a date according to locale.
 */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format a date with time according to locale.
 */
export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: SupportedLocale
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(-diffInHours, 'hour');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(-diffInDays, 'day');
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(-diffInMonths, 'month');
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(-diffInYears, 'year');
}

/**
 * Format a number according to locale.
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency according to locale.
 */
export function formatCurrency(
  value: number,
  locale: SupportedLocale,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format a percentage according to locale.
 */
export function formatPercent(
  value: number,
  locale: SupportedLocale,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    ...options,
  }).format(value);
}

/**
 * Format a compact number (e.g., "1.2K", "3.4M").
 */
export function formatCompactNumber(
  value: number,
  locale: SupportedLocale
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
