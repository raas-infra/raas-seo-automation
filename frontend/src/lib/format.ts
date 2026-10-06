export function domainOf(url: string): string {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** Reads a query-string parameter (pages use ?id=<projectId>). */
export function queryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}
