// ============================================================
// i18n — Lightweight internationalization for Agnes AI Tool
// ============================================================

import en from "@/locales/en.json";
import zh from "@/locales/zh.json";

type NestedKeys<T> = T extends string
  ? never
  : T extends Record<string, infer U>
    ? { [K in keyof T]: K extends string ? U extends string ? K : `${K}.${NestedKeys<U>}` : never }[keyof T]
    : never;

export type TranslationKey = NestedKeys<typeof en>;

// Locale files are nested objects (e.g. { nav: { chat: "..." } }); keep that
// structure so resolveNested() can walk dotted keys.
const locales: Record<string, typeof en> = {
  en,
  zh,
};

let currentLang = detectSystemLang();

function detectSystemLang(): string {
  if (typeof navigator !== "undefined") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  }
  return "en";
}

function resolveNested(obj: Record<string, unknown>, key: string): string {
  let current: unknown = obj;
  for (const part of key.split(".")) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return "";
    }
  }
  return typeof current === "string" ? current : "";
}

function interpolate(str: string, values?: Record<string, string>): string {
  if (!values) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
}

export function setLanguage(lang: string): void {
  currentLang = lang;
  localStorage.setItem("agnes_language", lang);
  applyLangAttribute();
}

export function getLanguage(): string {
  return currentLang;
}

export function initI18n(): void {
  const saved = localStorage.getItem("agnes_language");
  if (saved && saved in locales) {
    currentLang = saved;
  } else {
    currentLang = detectSystemLang();
    localStorage.setItem("agnes_language", currentLang);
  }
  applyLangAttribute();
}

function applyLangAttribute(): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
  }
}

/** Translate a key with optional value interpolation */
export function t(key: TranslationKey, values?: Record<string, string>): string {
  const locale = locales[currentLang] ?? locales.en;
  const fallback = resolveNested(en, key) ?? key;
  const translated = resolveNested(locale, key) ?? fallback;
  return interpolate(translated, values);
}
