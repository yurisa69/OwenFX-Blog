export function sortTagsByLength(tags: string[]): string[] {
  return [...tags].sort((a, b) => a.length - b.length || a.localeCompare(b))
}
