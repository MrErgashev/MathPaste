"use client";

import "katex/dist/katex.min.css";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { AppStep } from "@/lib/types";
import EditorPanel from "@/components/EditorPanel";
import PreviewPanel from "@/components/PreviewPanel";
import StatusBar from "@/components/StatusBar";
import ExportButton from "@/components/ExportButton";

export default function Home() {
  const { parsedContent, rawText, handlePaste, handleTextChange, clearContent } =
    useClipboardPaste();

  // Determine current step
  const step: AppStep = !rawText
    ? 1
    : parsedContent && parsedContent.segments.length > 0
      ? 3
      : 2;

  return (
    <div className="flex flex-col h-screen bg-[#0c0c14]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#0c0c14] border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative w-9 h-9">
            <div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20"
              style={{
                transform: "perspective(200px) rotateY(-8deg) rotateX(5deg)",
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg font-sans">
              M
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-sans tracking-tight">
              MathPaste
            </h1>
            <p className="text-[10px] text-gray-500 font-sans -mt-0.5">
              Formula konverter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton
            segments={parsedContent?.segments ?? null}
          />
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex flex-col min-[900px]:flex-row overflow-hidden">
        {/* Editor Panel - 45% */}
        <div className="h-1/2 min-[900px]:h-full min-[900px]:w-[45%] border-b min-[900px]:border-b-0 min-[900px]:border-r border-white/10">
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
