import { ContentSegment } from "./types";
import { renderMathToMathML } from "./katex-renderer";

/**
 * F4: Word Export
 * Generates a .doc file (HTML with Office namespaces + MathML).
 * Word opens this and converts MathML to native editable equations.
 */
export function generateWordDocument(segments: ContentSegment[]): Blob {
  const bodyHtml = segments.map(segmentToHtml).join("\n");

  const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="MathPaste">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: A4;
    margin: 2.5cm;
  }
  body {
    font-family: 'Cambria', 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000000;
  }
  h1 { font-size: 18pt; font-weight: bold; margin: 18pt 0 6pt 0; }
  h2 { font-size: 16pt; font-weight: bold; margin: 14pt 0 6pt 0; }
  h3 { font-size: 14pt; font-weight: bold; margin: 12pt 0 4pt 0; }
  h4 { font-size: 13pt; font-weight: bold; margin: 10pt 0 4pt 0; }
  h5 { font-size: 12pt; font-weight: bold; margin: 8pt 0 4pt 0; }
  h6 { font-size: 12pt; font-weight: bold; font-style: italic; margin: 8pt 0 4pt 0; }
  p { margin: 0 0 6pt 0; }
  .display-math {
    text-align: center;
    margin: 12pt 0;
    font-family: 'Cambria Math', 'Cambria', serif;
  }
  .inline-math {
    font-family: 'Cambria Math', 'Cambria', serif;
  }
  pre, code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 10pt;
    background-color: #f5f5f5;
    padding: 2px 4px;
  }
  pre {
    padding: 8pt;
    border: 1px solid #e0e0e0;
    white-space: pre-wrap;
    margin: 8pt 0;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8pt 0;
  }
  td, th {
    border: 1px solid #999999;
    padding: 4pt 8pt;
    font-size: 11pt;
  }
  th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  ul, ol { margin: 4pt 0 4pt 24pt; }
  li { margin: 2pt 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  return new Blob([fullHtml], { type: "application/msword" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function segmentToHtml(segment: ContentSegment): string {
  switch (segment.type) {
    case "text":
      return textToHtml(segment.content);

    case "heading": {
      const level = segment.level || 1;
      const tag = `h${Math.min(level, 6)}`;
      // Process bold/italic formatting in heading content
      let headingHtml = escapeHtml(segment.content);
      headingHtml = headingHtml.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      headingHtml = headingHtml.replace(/\*(.+?)\*/g, "<i>$1</i>");
      return `<${tag}>${headingHtml}</${tag}>`;
    }

    case "display-math": {
      const mathml = renderMathToMathML(segment.content, true);
      return `<p class="display-math">${mathml}</p>`;
    }

    case "inline-math": {
      const mathml = renderMathToMathML(segment.content, false);
      return `<span class="inline-math">${mathml}</span>`;
    }

    case "code":
      return `<pre><code>${escapeHtml(segment.content)}</code></pre>`;

    case "list-item":
      return `<li>${processInlineContent(segment.content)}</li>`;

    case "table":
      return tableToHtml(segment.content);

    default:
      return `<p>${escapeHtml(segment.content)}</p>`;
  }
}

function textToHtml(text: string): string {
  if (text === "\n") return "";

  // Process bold and italic
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/\*(.+?)\*/g, "<i>$1</i>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Process inline math $...$
  html = processInlineContent(html);

  return `<p>${html}</p>`;
}

function processInlineContent(html: string): string {
  // Replace \(...\) with inline MathML
  let result = html.replace(/\\\((.+?)\\\)/g, (_match, latex) => {
    const mathml = renderMathToMathML(latex, false);
    return `<span class="inline-math">${mathml}</span>`;
  });
  // Replace \[...\] with display MathML
  result = result.replace(/\\\[(.+?)\\\]/g, (_match, latex) => {
    const mathml = renderMathToMathML(latex, true);
    return `</p><p class="display-math">${mathml}</p><p>`;
  });
  // Replace $...$ with inline MathML (but not $$)
  result = result.replace(/(?<!\$)\$(?!\$)(.+?)\$(?!\$)/g, (_match, latex) => {
    const mathml = renderMathToMathML(latex, false);
    return `<span class="inline-math">${mathml}</span>`;
  });
  // Replace bare (...) with inline MathML when content looks like LaTeX
  result = result.replace(/\(([^)]+)\)/g, (fullMatch, inner) => {
    const hasLatex =
      /\\[a-zA-Z]+/.test(inner) ||
      /[_^]\{/.test(inner) ||
      /[_^][a-zA-Z0-9]/.test(inner) ||
      /\{[^}]*\}/.test(inner);
    if (hasLatex) {
      const mathml = renderMathToMathML(inner, false);
      return `<span class="inline-math">${mathml}</span>`;
    }
    return fullMatch;
  });
  return result;
}

function tableToHtml(jsonContent: string): string {
  try {
    const rows: string[][] = JSON.parse(jsonContent);
    if (rows.length === 0) return "";

    let html = "<table>";
    rows.forEach((row, i) => {
      html += "<tr>";
      row.forEach((cell) => {
        const tag = i === 0 ? "th" : "td";
        html += `<${tag}>${escapeHtml(cell)}</${tag}>`;
      });
      html += "</tr>";
    });
    html += "</table>";
    return html;
  } catch {
    return `<p>${escapeHtml(jsonContent)}</p>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
