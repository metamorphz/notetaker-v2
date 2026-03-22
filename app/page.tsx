"use client";

import { useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";
import { ImageUploader } from "@/components/ImageUploader";
import { OcrProcessor } from "@/components/OcrProcessor";
import { NotePreview } from "@/components/NotePreview";
import { downloadAllAsHtml } from "@/lib/download";

export type OcrEntry = {
  id: string;
  imageDataUrl: string;
  fileName: string;
  extractedText: string;
  status: "pending" | "processing" | "done" | "error";
};

export default function Home() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [entries, setEntries] = useState<OcrEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveResult, setSaveResult] = useState<string | null>(null);

  const handleLogin = () =>
    instance.loginPopup(loginRequest).then((response) => {
      if (response?.account) instance.setActiveAccount(response.account);
    });
  const handleLogout = () => instance.logoutPopup();

  const handleFilesAdded = (files: File[]) => {
    setSaveResult(null);
    const newEntries: OcrEntry[] = files.map((file) => ({
      id: crypto.randomUUID(),
      imageDataUrl: URL.createObjectURL(file),
      fileName: file.name,
      extractedText: "",
      status: "pending",
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  };

  const handleOcrResult = (id: string, text: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, extractedText: text, status: "done" } : e))
    );
  };

  const handleOcrError = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "error" } : e))
    );
  };

  const handleTextEdit = (id: string, text: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, extractedText: text } : e))
    );
  };

  const handleRemove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Convert a blob: URL to a base64 data URL so the server can read it
  const toDataUrl = (blobUrl: string): Promise<string> =>
    fetch(blobUrl)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );

  const handleSaveToOneNote = async () => {
    const done = entries.filter((e) => e.status === "done");
    if (!done.length) return;

    setSaving(true);
    setSaveResult(null);
    try {
      const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
      if (!account) throw new Error("No active account");

      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      // Convert all blob: URLs to base64 data URLs before sending to the server
      const entriesWithDataUrls = await Promise.all(
        done.map(async (e) => ({
          imageDataUrl: await toDataUrl(e.imageDataUrl),
          fileName: e.fileName,
          extractedText: e.extractedText,
        }))
      );

      const res = await fetch("/api/onenote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: tokenResponse.accessToken,
          entries: entriesWithDataUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaveResult("Saved to OneNote successfully!");
      setEntries([]);
    } catch (err: unknown) {
      setSaveResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    await downloadAllAsHtml(entries);
    setDownloading(false);
  };

  const readyCount = entries.filter((e) => e.status === "done").length;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">NoteTaker</h1>
          <p className="text-sm text-gray-500">Upload photos → OCR → OneNote</p>
        </div>
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Sign in with Microsoft
          </button>
        )}
      </div>

      {/* Upload area */}
      <ImageUploader onFilesAdded={handleFilesAdded} />

      {/* OCR + Preview entries */}
      {entries.length > 0 && (
        <div className="mt-6 space-y-4">
          {entries.map((entry) => (
            <div key={entry.id}>
              <OcrProcessor
                entry={entry}
                onResult={handleOcrResult}
                onError={handleOcrError}
              />
              <NotePreview
                entry={entry}
                onTextEdit={handleTextEdit}
                onRemove={handleRemove}
              />
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {readyCount > 0 && (
        <div className="mt-6 space-y-3">
          {/* Download All — no sign-in required */}
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading
              ? "Downloading…"
              : `⬇ Download ${readyCount} note${readyCount > 1 ? "s" : ""} as HTML`}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            or save to cloud
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Save to OneNote — requires sign-in */}
          {!isAuthenticated && (
            <p className="text-sm text-amber-600">
              Sign in with Microsoft (top right) to save directly to OneNote.
            </p>
          )}
          <button
            onClick={handleSaveToOneNote}
            disabled={saving || !isAuthenticated}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Saving to OneNote..."
              : `Save ${readyCount} note${readyCount > 1 ? "s" : ""} to OneNote`}
          </button>

          {saveResult && (
            <p
              className={`text-sm text-center ${
                saveResult.startsWith("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {saveResult}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
