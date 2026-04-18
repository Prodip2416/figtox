export function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (c: string) => c.toUpperCase());
}

export function toBemBlock(name: string): string {
  return toKebabCase(name) || "block";
}

export function toBemElement(block: string, element: string): string {
  return `${block}__${toKebabCase(element)}`;
}

export function toBemModifier(block: string, modifier: string): string {
  return `${block}--${toKebabCase(modifier)}`;
}

export function deduplicateChildNames(names: string[]): string[] {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  const seen = new Map<string, number>();
  return names.map((n) => {
    if (counts.get(n) === 1) return n;
    const idx = (seen.get(n) ?? 0) + 1;
    seen.set(n, idx);
    return `${n}-${idx}`;
  });
}
