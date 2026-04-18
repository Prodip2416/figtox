import prettier from "prettier";

export async function formatHtml(code: string): Promise<string> {
  return prettier.format(code, { parser: "html", printWidth: 100 });
}

export async function formatCss(code: string): Promise<string> {
  return prettier.format(code, { parser: "css", printWidth: 100 });
}
