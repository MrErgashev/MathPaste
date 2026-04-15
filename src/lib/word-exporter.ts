import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImportedXmlComponent,
  Packer,
  Paragraph,
  ParagraphChild,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { IRunOptions } from "docx";
import { mml2omml } from "mathml2omml";
import type { ContentSegment } from "./types";
import { renderMathToMathML } from "./katex-renderer";

const BODY_FONT = "Cambria";
const MATH_FONT = "Cambria Math";
const MONO_FONT = "Consolas";
const WORD_DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * F4: Word Export
 * Generates a real .docx file with Word-native OMML equations.
 */
export async function generateWordDocument(
  segments: ContentSegment[]
): Promise<Blob> {
  const doc = new Document({
    creator: "MathPaste",
    title: "MathPaste",
    styles: {
      default: {
        document: {
          run: {
            font: BODY_FONT,
            size: 24,
          },
          paragraph: {
            spacing: { after: 120, line: 360 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: segmentsToDocChildren(segments),
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(
    blob.type === WORD_DOCX_MIME ? blob : new Blob([blob], { type: WORD_DOCX_MIME })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function segmentsToDocChildren(segments: ContentSegment[]): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];
  let paragraphSegments: ContentSegment[] = [];

  const flushParagraph = () => {
    if (paragraphSegments.length === 0) return;

    const paragraphs = paragraphSegmentsToParagraphs(paragraphSegments);
    children.push(...paragraphs);
    paragraphSegments = [];
  };

  for (const segment of segments) {
    if (segment.type === "text" || segment.type === "inline-math") {
      if (segment.type === "text" && segment.content === "\n") {
        flushParagraph();
        continue;
      }

      paragraphSegments.push(segment);
      continue;
    }

    flushParagraph();
    children.push(...blockSegmentToDocChildren(segment));
  }

  flushParagraph();

  if (children.length === 0) {
    children.push(new Paragraph(""));
  }

  return children;
}

function blockSegmentToDocChildren(segment: ContentSegment): (Paragraph | Table)[] {
  switch (segment.type) {
    case "heading":
      return [headingToParagraph(segment)];

    case "display-math":
      return [displayMathToParagraph(segment.content)];

    case "code":
      return [codeToParagraph(segment.content)];

    case "list-item":
      return [listItemToParagraph(segment)];

    case "table":
      return [tableToDocx(segment.content)];

    default:
      return paragraphSegmentsToParagraphs([segment]);
  }
}

function paragraphSegmentsToParagraphs(
  segments: ContentSegment[]
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let children: ParagraphChild[] = [];

  const flush = () => {
    if (children.length === 0) return;

    paragraphs.push(
      new Paragraph({
        children,
        spacing: { after: 120, line: 360 },
      })
    );
    children = [];
  };

  for (const segment of segments) {
    if (segment.type === "inline-math") {
      children.push(mathToOmml(segment.content));
      continue;
    }

    const parts = textToParagraphParts(segment.content);
    for (const part of parts) {
      if (part.type === "inline") {
        children.push(...part.children);
      } else {
        flush();
        paragraphs.push(displayMathToParagraph(part.latex));
      }
    }
  }

  flush();
  return paragraphs;
}

type ParagraphPart =
  | { type: "inline"; children: ParagraphChild[] }
  | { type: "display"; latex: string };

function textToParagraphParts(text: string): ParagraphPart[] {
  const parts: ParagraphPart[] = [];
  const displayRegex = /\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = displayRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      parts.push({ type: "inline", children: inlineTextToChildren(before) });
    }

    parts.push({ type: "display", latex: (match[1] || match[2]).trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "inline",
      children: inlineTextToChildren(text.slice(lastIndex)),
    });
  }

  return parts.filter(
    (part) => part.type === "display" || part.children.length > 0
  );
}

function inlineTextToChildren(text: string): ParagraphChild[] {
  const children: ParagraphChild[] = [];
  const inlineRegex =
    /\\\(([\s\S]+?)\\\)|(?<!\$)\$(?!\$)([\s\S]+?)(?<!\$)\$(?!\$)|\*\*([^*]+?)\*\*|\*([^*]+?)\*|`([^`]+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push(...plainTextWithBareMath(text.slice(lastIndex, match.index)));
    }

    if (match[1] || match[2]) {
      children.push(mathToOmml((match[1] || match[2]).trim()));
    } else if (match[3]) {
      children.push(textRun(match[3], { bold: true }));
    } else if (match[4]) {
      children.push(textRun(match[4], { italics: true }));
    } else if (match[5]) {
      children.push(
        new TextRun({
          text: match[5],
          font: MONO_FONT,
          size: 20,
          shading: { fill: "F5F5F5", color: "auto" },
        })
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    children.push(...plainTextWithBareMath(text.slice(lastIndex)));
  }

  return children;
}

function plainTextWithBareMath(text: string): ParagraphChild[] {
  const children: ParagraphChild[] = [];
  const bareMathRegex = /\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = bareMathRegex.exec(text)) !== null) {
    const latex = match[1];
    if (!looksLikeLatex(latex)) continue;

    if (match.index > lastIndex) {
      children.push(textRun(text.slice(lastIndex, match.index)));
    }

    children.push(mathToOmml(latex.trim()));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    children.push(textRun(text.slice(lastIndex)));
  }

  return children;
}

function headingToParagraph(segment: ContentSegment): Paragraph {
  const level = Math.min(Math.max(segment.level || 1, 1), 6);
  const headingByLevel = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  } as const;
  const sizeByLevel: Record<number, number> = {
    1: 36,
    2: 32,
    3: 28,
    4: 26,
    5: 24,
    6: 24,
  };

  return new Paragraph({
    children: inlineTextToChildren(segment.content),
    spacing: { before: 240, after: 120 },
    heading: headingByLevel[level as keyof typeof headingByLevel],
    thematicBreak: false,
    style: undefined,
    pageBreakBefore: false,
    keepNext: false,
    keepLines: false,
    outlineLevel: level - 1,
    bidirectional: false,
    contextualSpacing: false,
    run: {
      size: sizeByLevel[level],
      bold: true,
      italics: level === 6,
      font: BODY_FONT,
    },
  });
}

function displayMathToParagraph(latex: string): Paragraph {
  return new Paragraph({
    children: [mathToOmml(latex)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 160 },
  });
}

function codeToParagraph(code: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: code,
        font: MONO_FONT,
        size: 20,
      }),
    ],
    spacing: { before: 120, after: 120 },
    shading: { fill: "F5F5F5", color: "auto" },
    border: {
      top: { style: BorderStyle.SINGLE, color: "E0E0E0", size: 1 },
      bottom: { style: BorderStyle.SINGLE, color: "E0E0E0", size: 1 },
      left: { style: BorderStyle.SINGLE, color: "E0E0E0", size: 1 },
      right: { style: BorderStyle.SINGLE, color: "E0E0E0", size: 1 },
    },
  });
}

function listItemToParagraph(segment: ContentSegment): Paragraph {
  return new Paragraph({
    children: [
      textRun(segment.ordered ? "1. " : "\u2022 "),
      ...inlineTextToChildren(segment.content),
    ],
    indent: { left: 360, hanging: 180 },
    spacing: { after: 80 },
  });
}

function tableToDocx(jsonContent: string): Table {
  let rows: string[][];

  try {
    rows = JSON.parse(jsonContent);
  } catch {
    rows = [[jsonContent]];
  }
  if (rows.length === 0) {
    rows = [[""]];
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, color: "999999", size: 1 },
      bottom: { style: BorderStyle.SINGLE, color: "999999", size: 1 },
      left: { style: BorderStyle.SINGLE, color: "999999", size: 1 },
      right: { style: BorderStyle.SINGLE, color: "999999", size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, color: "999999", size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, color: "999999", size: 1 },
    },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                shading:
                  rowIndex === 0 ? { fill: "F0F0F0", color: "auto" } : undefined,
                children: [
                  new Paragraph({
                    children: inlineTextToChildren(cell),
                    spacing: { after: 0 },
                  }),
                ],
              })
          ),
        })
    ),
  });
}

function mathToOmml(latex: string): ParagraphChild {
  try {
    const mathml = stripMathAnnotations(renderMathToMathML(latex, true));
    const omml = mml2omml(mathml);
    return ommlToXmlComponent(omml) as unknown as ParagraphChild;
  } catch {
    return textRun(latex, {
      font: MATH_FONT,
      italics: true,
    });
  }
}

function ommlToXmlComponent(omml: string): ImportedXmlComponent {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(omml, "application/xml");
  const parseError = xmlDoc.querySelector("parsererror");

  if (parseError) {
    throw new Error(parseError.textContent || "Invalid OMML XML");
  }

  return xmlElementToImportedComponent(xmlDoc.documentElement);
}

function xmlElementToImportedComponent(element: Element): ImportedXmlComponent {
  const attributes = Array.from(element.attributes).reduce<Record<string, string>>(
    (acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    },
    {}
  );
  const component = new ImportedXmlComponent(element.tagName, attributes);

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 1) {
      component.push(xmlElementToImportedComponent(child as Element));
    } else if (child.nodeType === 3 && child.nodeValue !== null) {
      component.push(child.nodeValue);
    }
  }

  return component;
}

function stripMathAnnotations(mathml: string): string {
  return mathml.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g, "");
}

function textRun(
  text: string,
  options: Partial<IRunOptions> = {}
): TextRun {
  return new TextRun({
    text,
    font: BODY_FONT,
    size: 24,
    ...options,
  });
}

function looksLikeLatex(text: string): boolean {
  return (
    /\\[a-zA-Z]+/.test(text) ||
    /[_^]\{/.test(text) ||
    /[_^][a-zA-Z0-9]/.test(text) ||
    /\\[{}\[\]()\\|]/.test(text) ||
    /\{[^}]*\}/.test(text) ||
    /[a-zA-Z]\s*=\s*[a-zA-Z0-9\\]/.test(text) ||
    /[a-zA-Z]\s*[+\-]\s*[a-zA-Z]/.test(text) ||
    /[a-zA-Z]\s*[\u2264\u2265\u2260\u2248\u00b1\u2213\u2192\u221e]/.test(text) ||
    /\d+\s*[+\-*/]\s*\d+/.test(text)
  );
}
