import { useState, useCallback } from "react";
import { ParsedContent } from "@/lib/types";
import { parseClipboardHTML } from "@/lib/clipboard-parser";
import { detectAndConvertFormulas } from "@/lib/regex-fallback";

export function useClipboardPaste() {
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(
    null
  );
  const [rawText, setRawText] = useState("");

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData.getData("text/html");
      const plain = e.clipboardData.getData("text/plain");

      if (html && html.trim()) {
        // Try HTML parser first (for KaTeX annotations from ChatGPT/Jupyter)
        const result = parseClipboardHTML(html);
        if (
          result.segments.length > 0 &&
          result.metadata.parseMethod !== "plain-text" &&
          result.metadata.formulaCount > 0
        ) {
          e.preventDefault();
          const displayText = segmentsToDisplayText(result.segments);
          setRawText(displayText);
          setParsedContent(result);
          return;
        }
      }

      // Fallback to plain text regex parser
      if (plain) {
        e.preventDefault();
        setRawText(plain);
        const result = detectAndConvertFormulas(plain);
        setParsedContent(result);
      }
    },
    []
  );

  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedContent(null);
      return;
    }
    const result = detectAndConvertFormulas(text);
    setParsedContent(result);
  }, []);

  const clearContent = useCallback(() => {
    setRawText("");
    setParsedContent(null);
  }, []);

  return {
    parsedContent,
    rawText,
    handlePaste,
    handleTextChange,
    clearContent,
  };
}

function segmentsToDisplayText(segments: ParsedContent["segments"]): string {
  return segments
    .map((seg) => {
      switch (seg.type) {
        case "heading":
          return "#".repeat(seg.level || 1) + " " + seg.content;
        case "display-math":
          return `$$${seg.content}$$`;
        case "inline-math":
          return `$${seg.content}$`;
        case "code":
          return "```\n" + seg.content + "\n```";
        case "list-item":
          return (seg.ordered ? "1. " : "- ") + seg.content;
        case "table":
          return seg.content;
        case "text":
          return seg.content;
        default:
          return seg.content;
      }
    })
    .join("\n");
}
