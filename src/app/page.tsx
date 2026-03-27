"use client";

import "katex/dist/katex.min.css";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { useTheme } from "@/hooks/useTheme";
import { AppStep } from "@/lib/types";
import EditorPanel from "@/components/EditorPanel";
import PreviewPanel from "@/components/PreviewPanel";
import StatusBar from "@/components/StatusBar";
import ExportButton from "@/components/ExportButton";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const { parsedContent, rawText, handlePaste, handleTextChange, clearContent } =
    useClipboardPaste();
  const { resolvedTheme, toggleTheme } = useTheme();

  // Determine current step
  const step: AppStep = !rawText
    ? 1
    : parsedContent && parsedContent.segments.length > 0
      ? 3
      : 2;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 backdrop-blur-xl bg-[var(--glass-bg)] border-b border-[var(--glass-border)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative w-9 h-9">
            <div
              className="absolute inset-0 rounded-xl shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                transform: "perspective(200px) rotateY(-8deg) rotateX(5deg)",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg font-sans">
              M
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--text-primary)] font-sans tracking-tight">
              MathPaste
            </h1>
            <p className="text-[10px] text-[var(--text-tertiary)] font-sans -mt-0.5">
              Formula konverter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle
            resolvedTheme={resolvedTheme}
            toggleTheme={toggleTheme}
          />
          <ExportButton
            segments={parsedContent?.segments ?? null}
          />
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex flex-col min-[900px]:flex-row overflow-hidden">
        {/* Editor Panel - 45% */}
        <div className="h-1/2 min-[900px]:h-full min-[900px]:w-[45%] border-b min-[900px]:border-b-0 min-[900px]:border-r border-[var(--border)] panel-divider">
          <EditorPanel
            value={rawText}
            onPaste={handlePaste}
            onChange={handleTextChange}
            onClear={clearContent}
          />
        </div>

        {/* Preview Panel - 55% */}
        <div className="h-1/2 min-[900px]:h-full min-[900px]:w-[55%]">
          <PreviewPanel content={parsedContent} />
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar
        step={step}
        metadata={parsedContent?.metadata ?? null}
      />
    </div>
  );
}
