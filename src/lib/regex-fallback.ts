import { ContentSegment, ParsedContent } from "./types";

/**
 * F2: Smart Regex Fallback
 * Parses plain text with LaTeX delimiters:
 *   - \[...\], \(...\), $$...$$, $...$  (standard LaTeX)
 *   - Bare [ ... ] on separate lines      (ChatGPT plain-text copy format)
 *   - Bare (...) with LaTeX heuristics    (ChatGPT inline math)
 */
export function detectAndConvertFormulas(plainText: string): ParsedContent {
  const start = performance.now();

  if (hasLatexDelimiters(plainText)) {
    return parseLatexDelimited(plainText, start);
  }

  // No delimiters — treat as plain text
  const segments = parsePlainText(plainText);
  return {
    segments,
    metadata: {
      formulaCount: 0,
      parseMethod: "plain-text",
      parseTimeMs: performance.now() - start,
    },
  };
}

/**
 * Check if text contains any LaTeX delimiter patterns.
 * Supports both backslash-bracket (\[...\]) and bare-bracket formats.
 */
function hasLatexDelimiters(text: string): boolean {
  return (
    /\$\$[\s\S]+?\$\$/.test(text) ||
    /(?<!\$)\$(?!\$).+?(?<!\$)\$(?!\$)/.test(text) ||
    /\\\[[\s\S]+?\\\]/.test(text) ||
    /\\\([\s\S]+?\\\)/.test(text) ||
    // ChatGPT bare bracket format: [ on its own line, content with LaTeX, ] on its own line
    hasBareBlockMath(text) ||
    // ChatGPT bare parentheses with LaTeX content
    hasBareInlineMath(text)
  );
}

/**
 * Detect bare [ ... ] display math blocks (ChatGPT format).
 * Pattern: line is just "[", followed by lines with LaTeX commands, then line is just "]"
 */
function hasBareBlockMath(text: string): boolean {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "[") {
      // Look ahead for ] on its own line
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === "]") {
          // Check if content between has LaTeX commands
          const content = lines
            .slice(i + 1, j)
            .join("\n")
            .trim();
          if (content && looksLikeLatex(content)) {
            return true;
          }
          break;
        }
      }
    }
  }
  return false;
}

/**
 * Detect bare (...) inline math with LaTeX content (ChatGPT format).
 * Only matches when content has LaTeX indicators like \, ^, _, {, etc.
 */
function hasBareInlineMath(text: string): boolean {
  // Match (content) where content looks like LaTeX
  const matches = text.match(/\(([^)]+)\)/g);
  if (!matches) return false;
  return matches.some((m) => {
    const inner = m.slice(1, -1);
    return looksLikeLatex(inner);
  });
}

/**
 * Heuristic: does this string look like LaTeX math?
 * Must contain LaTeX-specific patterns.
 */
function looksLikeLatex(text: string): boolean {
  return (
    /\\[a-zA-Z]+/.test(text) ||           // \frac, \int, \sin, etc.
    /[_^]\{/.test(text) ||                 // subscript/superscript with braces
    /[_^][a-zA-Z0-9]/.test(text) ||        // simple sub/superscript
    /\\[{}\[\]()\\|]/.test(text) ||        // escaped braces/brackets
    /\{[^}]*\}/.test(text) ||              // braces (common in LaTeX)
    /[a-zA-Z]\s*=\s*[a-zA-Z0-9\\]/.test(text) || // equations: z=x+iy, a=1, z=\pm i
    /[a-zA-Z]\s*[+\-]\s*[a-zA-Z]/.test(text) ||   // expressions: x+iy, a-1
    /[a-zA-Z]\s*[≤≥≠≈±∓→∞]/.test(text) || // unicode math operators
    /\d+\s*[+\-*/]\s*\d+/.test(text)       // arithmetic: 2+1, x^2+1
  );
}

/**
 * Clean ChatGPT multi-line math block content.
 * Removes ===== separator lines, strips # prefixes from derivation steps,
 * and wraps multi-line content in aligned environment.
 */
function cleanChatGPTMathBlock(rawContent: string): string {
  const lines = rawContent.split("\n");
  const cleaned = lines
    .filter((line) => !/^={3,}$/.test(line.trim())) // remove ==== separator lines
    .map((line) => line.replace(/^#\s+/, ""))         // remove # derivation step prefix
    .filter((line) => line.trim());                    // remove empty lines

  if (cleaned.length === 0) return rawContent;

  if (cleaned.length > 1) {
    // Multi-line: wrap in aligned environment for proper rendering
    return (
      "\\begin{aligned}\n" +
      cleaned.map((l) => l.trim()).join(" \\\\\n") +
      "\n\\end{aligned}"
    );
  }
  return cleaned[0].trim();
}

function parsePlainText(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      segments.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
    } else {
      segments.push({ type: "text", content: line });
    }
  }
  return segments;
}

function parseLatexDelimited(text: string, start: number): ParsedContent {
  const segments: ContentSegment[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Markdown headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      segments.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      i++;
      continue;
    }

    // Code blocks ```
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      segments.push({ type: "code", content: codeLines.join("\n") });
      i++;
      continue;
    }

    // --- Horizontal rule
    if (/^---+$/.test(line.trim())) {
      i++;
      continue;
    }

    // === lines (horizontal rule variant, skip)
    if (/^===+$/.test(line.trim())) {
      i++;
      continue;
    }

    // Display math: \[...\] (possibly multi-line, with backslash)
    if (line.trim().startsWith("\\[")) {
      let mathContent = line.trim().slice(2);
      if (mathContent.endsWith("\\]")) {
        // Single line: \[formula\]
        mathContent = mathContent.slice(0, -2).trim();
        segments.push({ type: "display-math", content: mathContent });
      } else {
        // Multi-line: \[ ... \]
        const mathLines = [mathContent];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith("\\]")) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          const lastLine = lines[i].trim();
          mathLines.push(lastLine.slice(0, -2));
        }
        segments.push({
          type: "display-math",
          content: mathLines.join("\n").trim(),
        });
      }
      i++;
      continue;
    }

    // Display math: bare [ on its own line (ChatGPT format)
    if (line.trim() === "[") {
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "]") {
        mathLines.push(lines[i]);
        i++;
      }
      const rawContent = mathLines.join("\n").trim();
      if (rawContent) {
        // Clean ChatGPT formatting (==== separators, # prefixes)
        const content = cleanChatGPTMathBlock(rawContent);
        if (looksLikeLatex(rawContent)) {
          segments.push({ type: "display-math", content });
        } else {
          // Not LaTeX — restore as text with brackets
          segments.push({ type: "text", content: `[${rawContent}]` });
        }
      }
      i++; // skip the ]
      continue;
    }

    // Display math: $$...$$ (possibly multi-line)
    if (line.trim().startsWith("$$")) {
      let mathContent = line.trim().slice(2);
      if (mathContent.endsWith("$$")) {
        mathContent = mathContent.slice(0, -2).trim();
        segments.push({ type: "display-math", content: mathContent });
      } else {
        const mathLines = [mathContent];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith("$$")) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          mathLines.push(lines[i].trim().slice(0, -2));
        }
        segments.push({
          type: "display-math",
          content: mathLines.join("\n").trim(),
        });
      }
      i++;
      continue;
    }

    // List items
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      segments.push({
        type: "list-item",
        content: listMatch[3],
        ordered: /^\d+\./.test(listMatch[2]),
      });
      i++;
      continue;
    }

    // Regular line — extract inline math
    extractInlineSegments(line, segments);
    i++;
  }

  const formulaCount = segments.filter(
    (s) => s.type === "inline-math" || s.type === "display-math"
  ).length;

  return {
    segments,
    metadata: {
      formulaCount,
      parseMethod: "latex-passthrough",
      parseTimeMs: performance.now() - start,
    },
  };
}

/**
 * Extract inline math from a line of text.
 * Handles: \(...\), $...$, and bare (...) with LaTeX content
 * Splits text into alternating text/math segments.
 */
function extractInlineSegments(
  line: string,
  segments: ContentSegment[]
): void {
  // Combined regex: match \(...\) or $...$ (not $$) or bare (...) with LaTeX
  // Process in order: \(...\) first, then $...$, then bare (...)
  const mathRegex =
    /\\\((.+?)\\\)|(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pieces: { start: number; end: number; latex: string }[] = [];

  // First pass: find \(...\) and $...$ matches
  while ((match = mathRegex.exec(line)) !== null) {
    const latex = match[1] || match[2];
    if (latex) {
      pieces.push({
        start: match.index,
        end: match.index + match[0].length,
        latex: latex.trim(),
      });
    }
  }

  // Second pass: find bare (...) with LaTeX content in remaining text
  const bareParenRegex = /\(([^)]+)\)/g;
  while ((match = bareParenRegex.exec(line)) !== null) {
    const inner = match[1];
    // Skip if this region overlaps with already found math
    const overlaps = pieces.some(
      (p) => match!.index < p.end && match!.index + match![0].length > p.start
    );
    if (!overlaps && looksLikeLatex(inner)) {
      pieces.push({
        start: match.index,
        end: match.index + match[0].length,
        latex: inner.trim(),
      });
    }
  }

  // Sort by position
  pieces.sort((a, b) => a.start - b.start);

  // Remove overlapping pieces (keep first)
  const filtered: typeof pieces = [];
  for (const p of pieces) {
    if (filtered.length === 0 || p.start >= filtered[filtered.length - 1].end) {
      filtered.push(p);
    }
  }

  if (filtered.length === 0) {
    // No matches — push whole line as text
    segments.push({ type: "text", content: line });
    return;
  }

  // Build segments from pieces
  for (let j = 0; j < filtered.length; j++) {
    const piece = filtered[j];

    // Text before this piece
    const textStart = j === 0 ? 0 : filtered[j - 1].end;
    if (piece.start > textStart) {
      const textBefore = line.slice(textStart, piece.start).trim();
      if (textBefore) {
        segments.push({ type: "text", content: textBefore });
      }
    }

    // Math piece
    segments.push({ type: "inline-math", content: piece.latex });
  }

  // Remaining text after last piece
  const lastPiece = filtered[filtered.length - 1];
  if (lastPiece.end < line.length) {
    const remaining = line.slice(lastPiece.end).trim();
    if (remaining) {
      segments.push({ type: "text", content: remaining });
    }
  }
}
