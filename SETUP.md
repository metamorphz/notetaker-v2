# NoteTaker v2 — Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Register an Azure App (free, ~5 minutes)

1. Go to https://portal.azure.com → **Azure Active Directory** → **App registrations** → **New registration**
2. Name: `NoteTaker` (anything)
3. Supported account types: **Personal Microsoft accounts only** (or Accounts in any org + personal)
4. Redirect URI: select **Single-page application (SPA)** → enter `http://localhost:3000`
5. Click **Register**
6. Copy the **Application (client) ID** — you'll need it next

### Add the production URL later
After deploying to Vercel, go back to your App Registration →
**Authentication** → add your Vercel URL (e.g. `https://your-app.vercel.app`) as a redirect URI.

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your client ID:

```
NEXT_PUBLIC_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 5. Deploy to Vercel (free)

1. Push this project to a GitHub repository
2. Go to https://vercel.com → **New Project** → import your repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_AZURE_CLIENT_ID` = your client ID
4. Deploy — Vercel auto-detects Next.js
5. Add the Vercel URL to your Azure App Registration redirect URIs (see step 2)

## How it works

1. Upload one or more photos
2. Tesseract.js runs OCR entirely in your browser (no server cost)
3. Review and edit the extracted text
4. Click **Save to OneNote** — signs you in via Microsoft if needed
5. Each photo + its text is saved as a separate OneNote page
