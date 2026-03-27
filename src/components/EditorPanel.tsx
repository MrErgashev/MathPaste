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
    <div className="flex flex-col h-full bg-[#0c0c14] text-gray-200 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-400 font-sans">
            Editor
          </span>
        </div>
        {value && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-sans px-2 py-1 rounded hover:bg-white/5"
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
          className="w-full h-full resize-none bg-transparent text-gray-200 placeholder-gray-600 p-4 font-mono text-sm leading-relaxed focus:outline-none selection:bg-indigo-500/30"
          spellCheck={false}
          autoFocus
        />

        {/* Empty state overlay */}
        {!value && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8">
            <div className="text-6xl mb-4 opacity-20">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm text-center font-sans">
              Ctrl+V bilan matnni joylashtiring
            </p>
          </div>
        )}
      </div>

      {/* Line count */}
      {value && (
        <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-600 font-mono">
          {value.split("\n").length} qator · {value.length} belgi
        </div>
      )}
    </div>
  );
}
