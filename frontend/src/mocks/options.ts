import type { SearchEngine } from "../types/models";

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const COUNTRIES: Option[] = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
];

export const LANGUAGES: Option[] = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
];

export const SEARCH_ENGINES: Option<SearchEngine>[] = [
  { value: "google", label: "Google" },
  { value: "bing", label: "Bing" },
];

export function labelFor(options: Option[], value: string | undefined): string {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}
