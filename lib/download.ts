import type { OcrEntry } from "@/app/page";

/** Convert a blob: URL to a base64 data URL so it can be embedded in a file. */
async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Build a self-contained HTML string for one entry. */
async function buildHtml(entry: OcrEntry): Promise<string> {
  const dataUrl = await blobUrlToDataUrl(entry.imageDataUrl);
  const title = entry.fileName.replace(/\.[^.]+$/, "");
  const escapedText = entry.extractedText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111; }
    h1 { font-size: 1.4rem; margin-bottom: 4px; }
    .meta { font-size: 0.8rem; color: #888; margin-bottom: 20px; }
    img { max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
    pre { white-space: pre-wrap; word-break: break-word; background: #f9fafb;
          border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;
          font-size: 0.9rem; line-height: 1.6; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Exported by NoteTaker · ${new Date().toLocaleString()}</p>
  <img src="${dataUrl}" alt="${title}" />
  <pre>${escapedText}</pre>
</body>
</html>`;
}

/** Trigger a browser file download. */
function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download a single entry as a self-contained HTML file. */
export async function downloadEntryAsHtml(entry: OcrEntry): Promise<void> {
  const html = await buildHtml(entry);
  const safeName = entry.fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_\-\s]/gi, "_");
  triggerDownload(`${safeName}.html`, html, "text/html");
}

/** Download all done entries as individual HTML files (sequential, ~300ms apart). */
export async function downloadAllAsHtml(entries: OcrEntry[]): Promise<void> {
  const done = entries.filter((e) => e.status === "done");
  for (let i = 0; i < done.length; i++) {
    await downloadEntryAsHtml(done[i]);
    // Brief pause so browser doesn't block multiple rapid downloads
    if (i < done.length - 1) await new Promise((r) => setTimeout(r, 350));
  }
}
