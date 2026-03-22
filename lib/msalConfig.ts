import { PublicClientApplication } from "@azure/msal-browser";

// Replace with your Azure App Registration client ID
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? "";

export const msalConfig = {
  auth: {
    clientId,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: typeof window !== "undefined" ? window.location.origin : "",
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["Notes.Create", "Notes.ReadWrite", "User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);
