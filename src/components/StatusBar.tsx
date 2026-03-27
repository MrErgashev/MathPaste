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
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c0c14] border-t border-white/10">
      {/* Steps */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans transition-all ${
                step >= s.num
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-gray-600"
              }`}
            >
              <span className="text-[10px]">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.num}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 h-px mx-0.5 ${
                  step > s.num ? "bg-indigo-500/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
          <span
            className="px-2 py-0.5 rounded bg-white/5"
            title="Aniqlash usuli"
          >
            {methodLabels[metadata.parseMethod] || metadata.parseMethod}
          </span>
          <span title="Formulalar soni">
            {metadata.formulaCount} formula
          </span>
          <span title="Ishlov berish vaqti">
            {metadata.parseTimeMs.toFixed(0)}ms
          </span>
        </div>
      )}
    </div>
  );
}
