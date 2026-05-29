export type Locale = "fr" | "en";

export type TranslationParams = Record<string, string | number>;

/** Nested message tree — leaf values are translation strings. */
export type Messages = {
  [key: string]: string | Messages;
};
