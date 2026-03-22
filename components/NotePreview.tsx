"use client";

import { useState } from "react";
import Image from "next/image";
import type { OcrEntry } from "@/app/page";
import { downloadEntryAsHtml } from "@/lib/download";

type Props = {
  entry: OcrEntry;
  onTextEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
};

const statusLabel: Record<OcrEntry["status"], string> = {
  pending: "Running OCR...",
  processing: "Running OCR...",
  done: "OCR complete",
  error: "OCR failed",
};

export function NotePreview({ entry, onTextEdit, onRemove }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadEntryAsHtml(entry);
    setDownloading(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={entry.imageDataUrl}
            alt={entry.fileName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium truncate">{entry.fileName}</p>
            <div className="flex items-center gap-3 flex-shrink-0">
              {entry.status === "done" && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  title="Download as HTML file"
                >
                  {downloading ? "Downloading…" : "⬇ Download"}
                </button>
              )}
              <button
                onClick={() => onRemove(entry.id)}
                className="text-gray-400 hover:text-red-500 text-xs"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 mb-2 font-medium
              ${entry.status === "done" ? "bg-green-100 text-green-700" : ""}
              ${entry.status === "error" ? "bg-red-100 text-red-600" : ""}
              ${entry.status === "pending" || entry.status === "processing" ? "bg-yellow-100 text-yellow-700" : ""}
            `}
          >
            {statusLabel[entry.status]}
          </span>

          {/* Editable text area */}
          {entry.status === "done" && (
            <textarea
              value={entry.extractedText}
              onChange={(e) => onTextEdit(entry.id, e.target.value)}
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Extracted text will appear here…"
            />
          )}

          {entry.status === "error" && (
            <p className="text-xs text-red-500">
              Could not extract text from this image. You can remove it or try a clearer photo.
            </p>
          )}

          {(entry.status === "pending" || entry.status === "processing") && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Processing…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
