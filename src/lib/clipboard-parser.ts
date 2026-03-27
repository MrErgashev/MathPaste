import { ContentSegment, ParsedContent } from "./types";

/**
 * F1: Clipboard HTML Parser
 * Reads text/html from clipboard, extracts LaTeX from KaTeX/MathJax annotations.
 * Priority: annotation[encoding="application/x-tex"] > script[type="math/tex"] > data-latex > <math>
 */
export function parseClipboardHTML(html: string): ParsedContent {
  const start = performance.now();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const segments: ContentSegment[] = [];
  let formulaCount = 0;
  let method: ParsedContent["metadata"]["parseMethod"] = "katex-annotation";

  // Check if we have KaTeX annotations
  const annotations = doc.querySelectorAll(
    'annotation[encoding="application/x-tex"]'
  );
  const mathJaxScripts = doc.querySelectorAll(
    'script[type="math/tex"], script[type="math/tex; mode=display"]'
  );
  const dataLatexEls = doc.querySelectorAll("[data-latex]");

  // Also check for KaTeX elements without annotations (browser may strip them on copy)
  const katexElements = doc.querySelectorAll(".katex, .katex-display");

  if (annotations.length === 0 && mathJaxScripts.length === 0 && dataLatexEls.length === 0) {
    if (katexElements.length > 0) {
      // KaTeX elements exist but no annotations — browser stripped them
      method = "katex-annotation";
    } else {
      method = "plain-text";
    }
  } else if (annotations.length > 0) {
    method = "katex-annotation";
  } else if (mathJaxScripts.length > 0) {
    method = "mathjax-script";
  } else {
    method = "data-attr";
  }

  // Walk the body and extract content
  const body = doc.body;
  walkNode(body, segments, { formulaCount: 0 });
  formulaCount = segments.filter(
    (s) => s.type === "inline-math" || s.type === "display-math"
  ).length;

  // Merge adjacent text segments
  const merged = mergeAdjacentText(segments);

  // If we detected a math method but found 0 formulas, fall back to plain-text
  // so the caller can try the regex fallback parser instead
  const finalMethod = formulaCount === 0 ? "plain-text" : method;

  return {
    segments: merged,
    metadata: {
      formulaCount,
      parseMethod: finalMethod,
      parseTimeMs: performance.now() - start,
    },
  };
}

interface WalkContext {
  formulaCount: number;
}

function walkNode(
  node: Node,
  segments: ContentSegment[],
  ctx: WalkContext
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      segments.push({ type: "text", content: text });
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  // Skip KaTeX internal elements — we extract from annotation
  if (
    el.classList.contains("katex-html") ||
    el.classList.contains("katex-mathml") ||
    tag === "annotation"
  ) {
    return;
  }

  // KaTeX block: extract LaTeX from annotation
  if (el.classList.contains("katex") || el.classList.contains("katex-display")) {
    const annotation = el.querySelector(
      'annotation[encoding="application/x-tex"]'
    );
    if (annotation?.textContent) {
      const isDisplay =
        el.classList.contains("katex-display") ||
        el.closest(".katex-display") !== null;
      segments.push({
        type: isDisplay ? "display-math" : "inline-math",
        content: annotation.textContent.trim(),
      });
      ctx.formulaCount++;
      return;
    }
    // Fallback: no annotation found (browser may strip on copy)
    // Try aria-label attribute
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) {
      const isDisplay =
        el.classList.contains("katex-display") ||
        el.closest(".katex-display") !== null;
      segments.push({
        type: isDisplay ? "display-math" : "inline-math",
        content: ariaLabel.trim(),
      });
      ctx.formulaCount++;
      return;
    }
    // Skip KaTeX visual rendering to avoid garbled text
    return;
  }

  // MathJax script tag
  if (
    tag === "script" &&
    (el.getAttribute("type") === "math/tex" ||
      el.getAttribute("type") === "math/tex; mode=display")
  ) {
    const isDisplay = el.getAttribute("type")?.includes("display") ?? false;
    segments.push({
      type: isDisplay ? "display-math" : "inline-math",
      content: el.textContent?.trim() || "",
    });
    ctx.formulaCount++;
    return;
  }

  // data-latex attribute
  if (el.hasAttribute("data-latex")) {
    const latex = el.getAttribute("data-latex") || "";
    segments.push({ type: "inline-math", content: latex });
    ctx.formulaCount++;
    return;
  }

  // MathML <math> element
  if (tag === "math") {
    // Try to get annotation from within math element
    const annotation = el.querySelector(
      'annotation[encoding="application/x-tex"]'
    );
    if (annotation?.textContent) {
      const display = el.getAttribute("display") === "block";
      segments.push({
        type: display ? "display-math" : "inline-math",
        content: annotation.textContent.trim(),
      });
      ctx.formulaCount++;
      return;
    }
    return;
  }

  // Headings
  const headingMatch = tag.match(/^h([1-6])$/);
  if (headingMatch) {
    const childSegments: ContentSegment[] = [];
    for (const child of Array.from(el.childNodes)) {
      walkNode(child, childSegments, ctx);
    }
    const textContent = childSegments
      .map((s) => (s.type === "text" ? s.content : `$${s.content}$`))
      .join(" ");
    segments.push({
      type: "heading",
      content: textContent,
      level: parseInt(headingMatch[1]),
    });
    return;
  }

  // Code blocks
  if (tag === "pre") {
    const code = el.querySelector("code");
    const text = code?.textContent || el.textContent || "";
    segments.push({ type: "code", content: text.trim() });
    return;
  }

  // Inline code (not inside pre)
  if (tag === "code" && el.parentElement?.tagName.toLowerCase() !== "pre") {
    segments.push({ type: "text", content: `\`${el.textContent}\`` });
    return;
  }

  // List items
  if (tag === "li") {
    const childSegments: ContentSegment[] = [];
    for (const child of Array.from(el.childNodes)) {
      walkNode(child, childSegments, ctx);
    }
    // Flatten: math stays as formulas in text
    const textParts: string[] = [];
    const mathParts: ContentSegment[] = [];
    for (const seg of childSegments) {
      if (seg.type === "inline-math" || seg.type === "display-math") {
        textParts.push(`$${seg.content}$`);
        mathParts.push(seg);
      } else {
        textParts.push(seg.content);
      }
    }
    segments.push({
      type: "list-item",
      content: textParts.join(" "),
      ordered: el.parentElement?.tagName.toLowerCase() === "ol",
    });
    return;
  }

  // Table
  if (tag === "table") {
    const rows: string[][] = [];
    el.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("td, th").forEach((td) => {
        cells.push(td.textContent?.trim() || "");
      });
      if (cells.length > 0) rows.push(cells);
    });
    if (rows.length > 0) {
      segments.push({
        type: "table",
        content: JSON.stringify(rows),
      });
    }
    return;
  }

  // Bold/italic — wrap content
  if (tag === "strong" || tag === "b") {
    const text = extractInlineText(el, ctx, segments);
    if (text) segments.push({ type: "text", content: `**${text}**` });
    return;
  }

  if (tag === "em" || tag === "i") {
    const text = extractInlineText(el, ctx, segments);
    if (text) segments.push({ type: "text", content: `*${text}*` });
    return;
  }

  // Paragraph and div — add line break
  if (tag === "p" || tag === "div") {
    const prevLen = segments.length;
    for (const child of Array.from(el.childNodes)) {
      walkNode(child, segments, ctx);
    }
    // Add a newline separator if we added content
    if (segments.length > prevLen) {
      segments.push({ type: "text", content: "\n" });
    }
    return;
  }

  // Default: recurse into children
  for (const child of Array.from(el.childNodes)) {
    walkNode(child, segments, ctx);
  }
}

function extractInlineText(
  el: Element,
  ctx: WalkContext,
  parentSegments: ContentSegment[]
): string {
  const parts: string[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent?.trim();
      if (t) parts.push(t);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element;
      if (
        childEl.classList.contains("katex") ||
        childEl.classList.contains("katex-display")
      ) {
        const annotation = childEl.querySelector(
          'annotation[encoding="application/x-tex"]'
        );
        if (annotation?.textContent) {
          parentSegments.push({
            type: "inline-math",
            content: annotation.textContent.trim(),
          });
          ctx.formulaCount++;
          return "";
        }
      }
      const t = childEl.textContent?.trim();
      if (t) parts.push(t);
    }
  }
  return parts.join(" ");
}

function mergeAdjacentText(segments: ContentSegment[]): ContentSegment[] {
  const result: ContentSegment[] = [];
  for (const seg of segments) {
    const last = result[result.length - 1];
    if (
      seg.type === "text" &&
      last?.type === "text" &&
      seg.content !== "\n" &&
      last.content !== "\n"
    ) {
      last.content += " " + seg.content;
    } else if (seg.type === "text" && seg.content === "\n" && last?.type === "text" && last.content.endsWith("\n")) {
      // Skip duplicate newlines
    } else {
      result.push({ ...seg });
    }
  }
  // Trim trailing newline segments
  while (
    result.length > 0 &&
    result[result.length - 1].type === "text" &&
    result[result.length - 1].content.trim() === ""
  ) {
    result.pop();
  }
  return result;
}
