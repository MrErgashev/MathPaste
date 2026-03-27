"use client";

import { useState } from "react";
import { ContentSegment } from "@/lib/types";
import { generateWordDocument, downloadBlob } from "@/lib/word-exporter";

interface ExportButtonProps {
  segments: ContentSegment[] | null;
}

export default function ExportButton({ segments }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!segments || segments.length === 0) return;

    setIsExporting(true);
    try {
      const blob = generateWordDocument(segments);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `MathPaste-${timestamp}.doc`);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const disabled = !segments || segments.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans text-sm font-medium
        transition-all duration-300
        ${
          disabled
            ? "bg-[var(--accent-soft)] text-[var(--text-tertiary)] cursor-not-allowed shadow-none border border-[var(--border)]"
            : isExporting
              ? "text-white cursor-wait shadow-lg"
              : "text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
        }
      `}
      style={
        !disabled
          ? {
              background: isExporting
                ? "linear-gradient(135deg, #818CF8, #A78BFA)"
                : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              boxShadow: isExporting
                ? "0 4px 16px rgba(99, 102, 241, 0.3)"
                : "0 4px 16px rgba(99, 102, 241, 0.25)",
            }
          : undefined
      }
    >
      {isExporting ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              className="opacity-75"
            />
          </svg>
          <span>Tayyorlanmoqda...</span>
        </>
      ) : (
        <>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Word yuklash</span>
        </>
      )}
    </button>
  );
}
