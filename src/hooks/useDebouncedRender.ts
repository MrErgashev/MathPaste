import { useState, useEffect, useRef, useMemo } from "react";
import { ParsedContent } from "@/lib/types";
import { detectAndConvertFormulas } from "@/lib/regex-fallback";

/**
 * Debounced re-parsing for manual text edits.
 * Returns parsed content after a delay to avoid excessive renders.
 */
export function useDebouncedRender(
  rawText: string,
  delayMs: number = 150
): ParsedContent | null {
  const [debouncedText, setDebouncedText] = useState(rawText);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedText(rawText);
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [rawText, delayMs]);

  return useMemo(() => {
    if (!debouncedText.trim()) return null;
    return detectAndConvertFormulas(debouncedText);
  }, [debouncedText]);
}
