import { NextRequest, NextResponse } from "next/server";

type EntryPayload = {
  imageDataUrl: string;   // data:image/...;base64,...
  fileName: string;
  extractedText: string;
};

type RequestBody = {
  accessToken: string;
  entries: EntryPayload[];
};

// Build a multipart/form-data body for a OneNote page with one image + text block
function buildMultipart(entry: EntryPayload, boundary: string): Buffer {
  const [meta, b64] = entry.imageDataUrl.split(",");
  const mimeMatch = meta.match(/data:(image\/[a-z+]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  const imageBuffer = Buffer.from(b64, "base64");
  const imageName = `img_${Date.now()}`;

  const title = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // e.g. "22 Mar 2026"
  const html = `<!DOCTYPE html>
<html>
  <head><title>${title}</title></head>
  <body>
    <h1>${title}</h1>
    <img src="name:${imageName}" alt="${title}" width="600" />
    <p style="white-space: pre-wrap; font-family: monospace;">${entry.extractedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</p>
  </body>
</html>`;

  const parts: Buffer[] = [];

  // Part 1: HTML presentation
  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="Presentation"\r\n` +
        `Content-Type: text/html\r\n\r\n` +
        html +
        `\r\n`
    )
  );

  // Part 2: image binary
  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${imageName}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
    )
  );
  parts.push(imageBuffer);
  parts.push(Buffer.from(`\r\n`));

  // Closing boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return Buffer.concat(parts);
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { accessToken, entries } = body;

  if (!accessToken || !entries?.length) {
    return NextResponse.json({ error: "Missing accessToken or entries" }, { status: 400 });
  }

  const results: { fileName: string; success: boolean; error?: string }[] = [];

  for (const entry of entries) {
    const boundary = `----NoteTakerBoundary${Date.now()}`;
    const multipart = buildMultipart(entry, boundary);

    try {
      const res = await fetch("https://graph.microsoft.com/v1.0/me/onenote/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: new Uint8Array(multipart),
      });

      if (!res.ok) {
        const err = await res.text();
        results.push({ fileName: entry.fileName, success: false, error: err });
      } else {
        results.push({ fileName: entry.fileName, success: true });
      }
    } catch (e: unknown) {
      results.push({
        fileName: entry.fileName,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const allOk = results.every((r) => r.success);
  return NextResponse.json({ results }, { status: allOk ? 200 : 207 });
}
