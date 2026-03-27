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
      <header className="relative flex items-center justify-between px-5 py-3 backdrop-blur-xl bg-[var(--glass-bg)] border-b border-[var(--glass-border)] sticky top-0 z-10">
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

        {/* Author info — subtle center */}
        <div className="hidden min-[900px]:flex items-center gap-3 absolute left-1/2 -translate-x-1/2 text-xs text-[var(--text-tertiary)] font-sans opacity-50 hover:opacity-80 transition-opacity duration-300">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(99,102,241,0.3))' }}>
              <defs>
                <linearGradient id="authorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="url(#authorGrad)" />
            </svg>
            <span>Ergashev Muhammadosdiq</span>
          </div>
          <span className="opacity-30">·</span>
          <a href="tel:+998997520565" className="flex items-center gap-1.5 hover:text-[var(--text-secondary)] transition-colors duration-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(99,102,241,0.3))' }}>
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="url(#authorGrad)" />
            </svg>
            <span>+998(99)752-05-65</span>
          </a>
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
