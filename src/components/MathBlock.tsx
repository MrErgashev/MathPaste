"use client";

import { renderMathToHTML } from "@/lib/katex-renderer";
import { useMemo } from "react";

interface MathBlockProps {
  latex: string;
  displayMode: boolean;
}

export default function MathBlock({ latex, displayMode }: MathBlockProps) {
  const html = useMemo(
    () => renderMathToHTML(latex, displayMode),
    [latex, displayMode]
  );

  if (displayMode) {
    return (
      <div
        className="my-4 rounded-xl border-l-4 px-5 py-4 overflow-x-auto transition-shadow duration-200 hover:shadow-md"
        style={{
          borderColor: 'var(--math-border)',
          background: `linear-gradient(135deg, var(--math-bg-from), var(--math-bg-to))`,
          boxShadow: 'var(--shadow-sm)',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className="inline mx-0.5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
