import type { CreateProjectInput, SearchEngine } from "../types/models";
import { domainOf } from "./format";

export interface ProjectFormValues {
  websiteUrl: string;
  targetCountry: string;
  targetLanguage: string;
  businessDescription: string;
  seedKeywords: string; // comma or newline separated
  knownCompetitors: string;
  targetSearchEngine: SearchEngine | "";
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  websiteUrl: "",
  targetCountry: "",
  targetLanguage: "",
  businessDescription: "",
  seedKeywords: "",
  knownCompetitors: "",
  targetSearchEngine: "",
};

const MIN_DESCRIPTION = 20;

// One DNS label: 1–63 letters/digits/hyphens, not starting or ending with a hyphen.
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
// Top-level domain: letters only, or a punycode TLD (xn--...).
const TLD = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

function isValidHostname(hostname: string): boolean {
  const labels = hostname.split(".");
  return labels.length >= 2 && labels.every((l) => HOST_LABEL.test(l)) && TLD.test(labels[labels.length - 1]);
}

/** Adds https:// when missing and returns a normalised URL, or null if invalid. */
export function normaliseUrl(value: string): string | null {
  const trimmed = value.trim();
  // URL() would percent-encode inner whitespace (e.g. "exa%20mple.com"), so reject it up front.
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!isValidHostname(url.hostname)) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const splitList = (value: string): string[] =>
  [...new Set(value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean))];

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  if (!values.websiteUrl.trim()) errors.websiteUrl = "Website URL is required.";
  else if (!normaliseUrl(values.websiteUrl)) errors.websiteUrl = "Enter a valid URL, e.g. https://example.com";
  if (!values.targetCountry) errors.targetCountry = "Select a target country.";
  if (!values.targetLanguage) errors.targetLanguage = "Select a target language.";
  const description = values.businessDescription.trim();
  if (!description) errors.businessDescription = "Business description is required.";
  else if (description.length < MIN_DESCRIPTION)
    errors.businessDescription = `Add a bit more detail (at least ${MIN_DESCRIPTION} characters).`;
  const badCompetitor = splitList(values.knownCompetitors).find((c) => !normaliseUrl(c));
  if (badCompetitor) errors.knownCompetitors = `"${badCompetitor}" is not a valid domain or URL.`;
  return errors;
}

export function toCreateProjectInput(values: ProjectFormValues): CreateProjectInput {
  return {
    websiteUrl: normaliseUrl(values.websiteUrl)!,
    targetCountry: values.targetCountry,
    targetLanguage: values.targetLanguage,
    businessDescription: values.businessDescription.trim(),
    seedKeywords: splitList(values.seedKeywords),
    knownCompetitors: [...new Set(splitList(values.knownCompetitors).map(domainOf))],
    targetSearchEngine: values.targetSearchEngine || "google",
  };
}
