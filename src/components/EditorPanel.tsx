"use client";

interface EditorPanelProps {
  value: string;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onChange: (text: string) => void;
  onClear: () => void;
}

export default function EditorPanel({
  value,
  onPaste,
  onChange,
  onClear,
}: EditorPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-editor)] text-[var(--text-primary)] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-indigo-500 animate-ping opacity-40" />
          </div>
          <span className="text-sm font-medium text-[var(--text-tertiary)] font-sans">
            Editor
          </span>
        </div>
        {value && (
          <button
            onClick={onClear}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all font-sans px-2.5 py-1 rounded-lg hover:bg-[var(--accent-soft)] border border-transparent hover:border-[var(--border)]"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          value={value}
          onPaste={onPaste}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"ChatGPT yoki Claude dan nusxa ko'chirgan matnni\nbu yerga joylashtiring...\n\nCtrl+V bosing"}
          className="w-full h-full resize-none bg-transparent text-[var(--text-primary)] placeholder-[var(--editor-placeholder)] p-4 font-mono text-sm leading-relaxed focus:outline-none"
          style={{ caretColor: '#6366F1' }}
          spellCheck={false}
          autoFocus
        />

        {/* Empty state overlay */}
        {!value && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8">
            <div className="animate-float" style={{ opacity: 'var(--empty-state-opacity)' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <p className="text-[var(--text-tertiary)] text-sm text-center font-sans mt-4">
              Ctrl+V bilan matnni joylashtiring
            </p>
          </div>
        )}
      </div>

      {/* Line count */}
      {value && (
        <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-tertiary)] font-mono bg-[var(--editor-line-count-bg)]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--accent-soft)]">
            {value.split("\n").length} qator
          </span>
          <span className="mx-1.5 text-[var(--border)]">·</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--accent-soft)]">
            {value.length} belgi
          </span>
        </div>
      )}
    </div>
  );
}
