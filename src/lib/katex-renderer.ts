import katex from "katex";

/**
 * Render LaTeX to HTML for live preview.
 */
export function renderMathToHTML(
  latex: string,
  displayMode: boolean
): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: "#dc2626",
      output: "htmlAndMathml",
      trust: true,
      strict: false,
    });
  } catch {
    return `<span style="color: #dc2626; font-family: monospace;">${escapeHtml(latex)}</span>`;
  }
}

/**
 * Render LaTeX to pure MathML for Word export.
 */
export function renderMathToMathML(
  latex: string,
  displayMode: boolean
): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: "#dc2626",
      output: "mathml",
      trust: true,
      strict: false,
    });
  } catch {
    return escapeHtml(latex);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
