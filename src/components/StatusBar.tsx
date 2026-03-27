"use client";

import { AppStep, ParseMetadata } from "@/lib/types";

interface StatusBarProps {
  step: AppStep;
  metadata: ParseMetadata | null;
}

const steps = [
  { num: 1, label: "Joylashtiring", icon: "📋" },
  { num: 2, label: "Ko'rib chiqing", icon: "👁" },
  { num: 3, label: "Yuklab oling", icon: "📥" },
];

const methodLabels: Record<string, string> = {
  "katex-annotation": "KaTeX HTML",
  "mathjax-script": "MathJax",
  "data-attr": "Data attribute",
  "regex-fallback": "Regex aniqlash",
  "latex-passthrough": "LaTeX",
  "plain-text": "Oddiy matn",
};

export default function StatusBar({ step, metadata }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 backdrop-blur-lg bg-[var(--glass-bg)] border-t border-[var(--glass-border)]">
      {/* Steps */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans transition-all duration-300 ${
                step >= s.num
                  ? "bg-[var(--step-active-bg)] text-[var(--step-active-text)] font-medium"
                  : "text-[var(--step-inactive-text)]"
              }`}
            >
              <span className="text-[10px]">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.num}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 h-px mx-0.5 transition-colors duration-300 ${
                  step > s.num ? "bg-[var(--step-connector-active)]" : "bg-[var(--step-connector-inactive)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)]">
          <span
            className="px-2 py-0.5 rounded-md bg-[var(--meta-pill-bg)] border border-[var(--border-subtle)]"
            title="Aniqlash usuli"
          >
            {methodLabels[metadata.parseMethod] || metadata.parseMethod}
          </span>
          <span
            className="px-2 py-0.5 rounded-md bg-[var(--meta-pill-bg)]"
            title="Formulalar soni"
          >
            {metadata.formulaCount} formula
          </span>
          <span
            className="px-2 py-0.5 rounded-md bg-[var(--meta-pill-bg)]"
            title="Ishlov berish vaqti"
          >
            {metadata.parseTimeMs.toFixed(0)}ms
          </span>
        </div>
      )}
    </div>
  );
}
