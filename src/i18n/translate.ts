import type { Messages, TranslationParams } from "./types";

export function getMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: string | Messages | undefined = messages;
  for (const part of parts) {
    if (current == null || typeof current === "string") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value !== undefined ? String(value) : `{${name}}`;
  });
}

export function createTranslator(messages: Messages) {
  return function t(key: string, params?: TranslationParams): string {
    const raw = getMessage(messages, key);
    if (raw === undefined) return key;
    return interpolate(raw, params);
  };
}

export type TFunction = ReturnType<typeof createTranslator>;
