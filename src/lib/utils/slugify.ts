export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Appends a short random suffix so slugs stay unique without a DB round-trip loop. */
export function uniqueSlug(text: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugify(text)}-${suffix}`;
}
