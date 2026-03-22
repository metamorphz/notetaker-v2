import type { Metadata } from "next";
import "./globals.css";
import { MsalProviderWrapper } from "@/components/MsalProviderWrapper";

export const metadata: Metadata = {
  title: "NoteTaker — OCR to OneNote",
  description: "Upload photos, extract text with OCR, save to OneNote",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <MsalProviderWrapper>{children}</MsalProviderWrapper>
      </body>
    </html>
  );
}
