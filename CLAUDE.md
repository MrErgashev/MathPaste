# MathPaste

ChatGPT/Claude dan ko'chirilgan matematik formulalarni Word formatga konvertatsiya qiluvchi web ilova.

## Arxitektura

Next.js 16 (App Router) + KaTeX + Tailwind CSS v4. Butun ilova bitta sahifadan iborat (`src/app/page.tsx`).

### Asosiy oqim
1. Foydalanuvchi ChatGPT/Claude dan matnni copy → MathPaste ga paste
2. Parser formulalarni ajratadi → `ContentSegment[]` massiv
3. Preview panelda KaTeX bilan renderlanadi
4. "Word yuklash" → MathML bilan `.doc` fayl generatsiya qilinadi

### Parsing pipeline (prioritet tartibida)
- **Clipboard HTML parser** (`src/lib/clipboard-parser.ts`): KaTeX annotation, MathJax, data-latex, MathML
- **Regex fallback** (`src/lib/regex-fallback.ts`): `\[...\]`, `$$...$$`, `\(...\)`, `$...$`, bare `[...\n]` (ChatGPT format)

### ChatGPT format xususiyatlari
ChatGPT dan copy qilinganda plain text da:
- Display math: bare `[` va `]` alohida qatorlarda (backslash yo'q)
- Inline math: bare `(formula)` (backslash yo'q)
- Multi-line formulalarda `====` separator va `# ` prefix ishlatiladi
- `cleanChatGPTMathBlock()` bu formatni KaTeX uchun tozalaydi

## Loyiha tuzilishi

```
src/
├── app/
│   ├── page.tsx          # Asosiy sahifa (Editor + Preview layout)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles (Tailwind v4)
├── components/
│   ├── EditorPanel.tsx    # Textarea editor
│   ├── PreviewPanel.tsx   # KaTeX preview renderer
│   ├── MathBlock.tsx      # KaTeX math component
│   ├── ExportButton.tsx   # Word export button
│   └── StatusBar.tsx      # Bottom status bar
├── hooks/
│   ├── useClipboardPaste.ts  # Paste handler + text change
│   └── useDebouncedRender.ts # Debounced re-parsing
└── lib/
    ├── types.ts           # ContentSegment, ParsedContent, AppStep
    ├── clipboard-parser.ts # HTML clipboard → segments
    ├── regex-fallback.ts   # Plain text → segments (ChatGPT format)
    ├── katex-renderer.ts   # LaTeX → HTML/MathML via KaTeX
    └── word-exporter.ts    # Segments → .doc (HTML + MathML)
```

## Muhim qoidalar

- `looksLikeLatex()` heuristic: `\command`, `^`, `_`, `{`, `=`, `+`, `-` belgilarni tekshiradi
- Word export HTML + Office XML namespace formatda (`.doc`), MathML formulalar bilan
- KaTeX `throwOnError: false` — parse error qizil rangda ko'rsatiladi, crash emas
- Barcha request API lar async: `await cookies()`, `await headers()`, etc (Next.js 16)
- `proxy.ts` ishlatish kerak, `middleware.ts` emas (Next.js 16)

## Ishga tushirish

```bash
npm install
npm run dev    # localhost:3000
npm run build  # production build
```

@AGENTS.md
