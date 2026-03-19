/** Escape `]` as `]]` and wrap in brackets for safe SQL identifiers */
export function quoteSqlName(name: string): string {
  return `[${name.replace(/\]/g, "]]")}]`;
}
