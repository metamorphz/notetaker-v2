"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onFilesAdded: (files: File[]) => void;
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

export function ImageUploader({ onFilesAdded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const process = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const valid = Array.from(files).filter((f) => ACCEPTED.includes(f.type));
      if (valid.length) onFilesAdded(valid);
    },
    [onFilesAdded]
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files); }}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"}`}
    >
      <p className="text-gray-500 text-sm">
        Drag & drop photos here, or <span className="text-blue-600 font-medium">click to browse</span>
      </p>
      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, BMP supported</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => process(e.target.files)}
      />
    </div>
  );
}
