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
        className="my-4 rounded-xl border-l-4 border-indigo-500 bg-gradient-to-br from-indigo-50/60 to-violet-50/60 px-5 py-4 overflow-x-auto"
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
