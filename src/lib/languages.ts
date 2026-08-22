/** 支持的语言列表(30 种世界常用语言)。
 *  name: 英文名,作为偏好设置的值、prompt 中的语言标识(机器可读)
 *  title: 双语显示名,用于 UI 展示
 */
export interface Language {
  name: string;
  title: string;
}

export const LANGUAGES: Language[] = [
  { name: "Chinese (Simplified)", title: "简体中文" },
  { name: "Chinese (Traditional)", title: "繁體中文" },
  { name: "English", title: "English" },
  { name: "Japanese", title: "日本語" },
  { name: "Korean", title: "한국어" },
  { name: "French", title: "Français" },
  { name: "German", title: "Deutsch" },
  { name: "Spanish", title: "Español" },
  { name: "Portuguese", title: "Português" },
  { name: "Russian", title: "Русский" },
  { name: "Italian", title: "Italiano" },
  { name: "Arabic", title: "العربية" },
  { name: "Thai", title: "ไทย" },
  { name: "Vietnamese", title: "Tiếng Việt" },
  { name: "Indonesian", title: "Bahasa Indonesia" },
  { name: "Turkish", title: "Türkçe" },
  { name: "Dutch", title: "Nederlands" },
  { name: "Polish", title: "Polski" },
  { name: "Ukrainian", title: "Українська" },
  { name: "Greek", title: "Ελληνικά" },
  { name: "Hebrew", title: "עברית" },
  { name: "Hindi", title: "हिन्दी" },
  { name: "Malay", title: "Bahasa Melayu" },
  { name: "Czech", title: "Čeština" },
  { name: "Swedish", title: "Svenska" },
  { name: "Norwegian", title: "Norsk" },
  { name: "Danish", title: "Dansk" },
  { name: "Finnish", title: "Suomi" },
  { name: "Hungarian", title: "Magyar" },
  { name: "Romanian", title: "Română" },
];

export const DEFAULT_TARGET_LANGUAGE = "Chinese (Simplified)";

export function languageTitle(name: string): string {
  return LANGUAGES.find((l) => l.name === name)?.title ?? name;
}
