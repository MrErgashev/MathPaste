export interface ContentSegment {
  type:
    | "text"
    | "inline-math"
    | "display-math"
    | "heading"
    | "code"
    | "list-item"
    | "table";
  content: string;
  level?: number;
  ordered?: boolean;
}

export interface ParseMetadata {
  formulaCount: number;
  parseMethod:
    | "katex-annotation"
    | "mathjax-script"
    | "data-attr"
    | "regex-fallback"
    | "plain-text"
    | "latex-passthrough";
  parseTimeMs: number;
}

export interface ParsedContent {
  segments: ContentSegment[];
  metadata: ParseMetadata;
}

export type AppStep = 1 | 2 | 3;
