export function markdownToBlocks(markdown: string) {
  return markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
}
