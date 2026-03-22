"use client";

import { useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import type { OcrEntry } from "@/app/page";

type Props = {
  entry: OcrEntry;
  onResult: (id: string, text: string) => void;
  onError: (id: string) => void;
};

export function OcrProcessor({ entry, onResult, onError }: Props) {
  const started = useRef(false);

  useEffect(() => {
    if (entry.status !== "pending" || started.current) return;
    started.current = true;

    Tesseract.recognize(entry.imageDataUrl, "eng", {
      logger: () => {}, // suppress verbose progress logs
    })
      .then(({ data: { text } }) => onResult(entry.id, text.trim()))
      .catch(() => onError(entry.id));
  }, [entry, onResult, onError]);

  // This component is logic-only; rendering is handled by NotePreview
  return null;
}
