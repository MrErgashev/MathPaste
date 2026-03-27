"use client";

import { ParsedContent, ContentSegment } from "@/lib/types";
import MathBlock from "./MathBlock";

interface PreviewPanelProps {
  content: ParsedContent | null;
}

export default function PreviewPanel({ content }: PreviewPanelProps) {
  if (!content || content.segments.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-preview)] items-center justify-center px-8">
        <div className="text-center max-w-xs">
          <div className="animate-float" style={{ opacity: 'var(--empty-state-opacity)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500 mx-auto">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-[var(--text-tertiary)] text-sm font-sans mt-4">
            Natija bu yerda ko&apos;rinadi
          </p>
          <p className="text-[var(--text-tertiary)] text-xs font-sans mt-1 opacity-60">
            Formulalar xuddi originaldagidek renderlanadi
          </p>
        </div>
      </div>
    );
  }

  // Group consecutive text + inline-math segments into paragraphs
  const groups = groupSegments(content.segments);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-preview)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-[var(--text-tertiary)] font-sans">
            Ko&apos;rish
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)]">
            {content.metadata.formulaCount} formula
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)]">
            {content.metadata.parseTimeMs.toFixed(0)}ms
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-none prose-container font-serif text-[var(--text-primary)] leading-relaxed">
          {groups.map((group, i) => (
            <GroupRenderer key={i} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
}

type SegmentGroup =
  | { type: "paragraph"; segments: ContentSegment[] }
  | { type: "block"; segment: ContentSegment };

/**
 * Group consecutive text/inline-math into paragraph groups.
 * Block elements (heading, display-math, code, table, list-item) stay separate.
 */
function groupSegments(segments: ContentSegment[]): SegmentGroup[] {
  const groups: SegmentGroup[] = [];
  let currentParagraph: ContentSegment[] = [];

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      groups.push({ type: "paragraph", segments: [...currentParagraph] });
      currentParagraph = [];
    }
  }

  for (const seg of segments) {
    if (seg.type === "text" || seg.type === "inline-math") {
      // Skip empty newlines at start
      if (seg.type === "text" && seg.content === "\n") {
        flushParagraph();
        continue;
      }
      currentParagraph.push(seg);
    } else {
      // Block element — flush paragraph and add block
      flushParagraph();
      groups.push({ type: "block", segment: seg });
    }
  }

  flushParagraph();
  return groups;
}

function GroupRenderer({ group }: { group: SegmentGroup }) {
  if (group.type === "paragraph") {
    return (
      <p className="mb-2 text-[15px]">
        {group.segments.map((seg, i) => {
          if (seg.type === "inline-math") {
            return <MathBlock key={i} latex={seg.content} displayMode={false} />;
          }
          return <InlineContent key={i} text={seg.content} />;
        })}
      </p>
    );
  }

  return <BlockRenderer segment={group.segment} />;
}

function BlockRenderer({ segment }: { segment: ContentSegment }) {
  switch (segment.type) {
    case "heading": {
      const Tag = `h${Math.min(segment.level || 1, 6)}` as keyof React.JSX.IntrinsicElements;
      const sizes: Record<number, string> = {
        1: "text-2xl font-bold mt-6 mb-3",
        2: "text-xl font-bold mt-5 mb-2",
        3: "text-lg font-semibold mt-4 mb-2",
        4: "text-base font-semibold mt-3 mb-1",
        5: "text-sm font-semibold mt-2 mb-1",
        6: "text-sm font-semibold italic mt-2 mb-1",
      };
      return (
        <Tag className={`${sizes[segment.level || 1]} text-[var(--text-primary)] font-sans`}>
          <InlineContent text={segment.content} />
        </Tag>
      );
    }

    case "display-math":
      return <MathBlock latex={segment.content} displayMode={true} />;

    case "code":
      return (
        <pre className="bg-[var(--code-bg)] border border-[var(--code-border)] rounded-xl px-4 py-3 my-3 overflow-x-auto">
          <code className="text-sm font-mono text-[var(--text-secondary)]">
            {segment.content}
          </code>
        </pre>
      );

    case "list-item":
      return (
        <div className="flex gap-2 mb-1 pl-4">
          <span className="text-indigo-400 select-none">•</span>
          <span className="text-[15px]">
            <InlineContent text={segment.content} />
          </span>
        </div>
      );

    case "table":
      return <TableRenderer content={segment.content} />;

    default:
      return (
        <p className="mb-2 text-[15px]">
          <InlineContent text={segment.content} />
        </p>
      );
  }
}

function InlineContent({ text }: { text: string }) {
  // Process inline math \(...\), $...$, and formatting **bold**, *italic*, `code`
  const parts = text.split(
    /(\\\(.+?\\\)|\$[^$]+?\$|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g
  );

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("\\(") && part.endsWith("\\)")) {
          const latex = part.slice(2, -2);
          return <MathBlock key={i} latex={latex} displayMode={false} />;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const latex = part.slice(1, -1);
          return <MathBlock key={i} latex={latex} displayMode={false} />;
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={i} className="bg-[var(--code-bg)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--code-text)] border border-[var(--code-border)]">
              {part.slice(1, -1)}
            </code>
          );
        }
        // Check for bare (formula) with LaTeX content
        return <InlineTextWithBareMath key={i} text={part} />;
      })}
    </>
  );
}

/**
 * Renders text that may contain bare (...) inline math from ChatGPT format.
 * Only treats (...) as math if content contains LaTeX indicators.
 */
function InlineTextWithBareMath({ text }: { text: string }) {
  // Match bare parentheses containing LaTeX
  const bareMathRegex = /\(([^)]+)\)/g;
  const pieces: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = bareMathRegex.exec(text)) !== null) {
    const inner = match[1];
    const hasLatex =
      /\\[a-zA-Z]+/.test(inner) ||
      /[_^]\{/.test(inner) ||
      /[_^][a-zA-Z0-9]/.test(inner) ||
      /\{[^}]*\}/.test(inner);

    if (hasLatex) {
      // Text before
      if (match.index > lastIndex) {
        pieces.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
      }
      // Math
      pieces.push(<MathBlock key={key++} latex={inner} displayMode={false} />);
      lastIndex = match.index + match[0].length;
    }
  }

  if (pieces.length === 0) {
    return <span>{text}</span>;
  }

  // Remaining text
  if (lastIndex < text.length) {
    pieces.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{pieces}</>;
}

function TableRenderer({ content }: { content: string }) {
  const rows = parseTableRows(content);
  if (!rows || rows.length === 0) {
    return <p className="text-[var(--text-tertiary)]">{content}</p>;
  }

  return (
    <div className="overflow-x-auto my-3 rounded-xl border border-[var(--table-border)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {rows[0].map((cell, i) => (
              <th key={i} className="border-b border-[var(--table-border)] bg-[var(--table-header-bg)] px-3 py-2.5 text-left font-semibold text-[var(--text-primary)]">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i} className="border-b border-[var(--border-subtle)] last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[var(--table-cell-text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseTableRows(content: string): string[][] | null {
  try {
    const rows: string[][] = JSON.parse(content);
    return rows;
  } catch {
    return null;
  }
}
