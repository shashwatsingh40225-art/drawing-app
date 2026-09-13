export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().slice(0, 30);
}

export function deduplicateTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalizeTag))].filter(Boolean);
}
