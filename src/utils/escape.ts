export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeJsx(text: string): string {
  if (/[{}<>]/.test(text)) {
    const escaped = text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `{'${escaped}'}`;
  }
  return text;
}

export function escapeTemplateLiteral(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}
