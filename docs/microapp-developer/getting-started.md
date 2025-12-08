# Micro‑App Developer Guide

This guide shows you how to build, test, package, and publish a web Micro‑App that runs inside the Super App’s WebView. It includes a quickstart, a bridge primer, local preview tips, packaging and versioning, and upload/publish steps.


## Quickstart (Hello Micro‑App)

1. Scaffold a web app (any framework works). Example: React + Vite

```bash
npm create vite@latest my-microapp -- --template react-ts
cd my-microapp
npm install
```

2. Add safe bridge access and a simple call

```tsx
// src/App.tsx
import { useEffect, useState } from "react";

export default function App() {
  const [tokenPreview, setTokenPreview] = useState<string | undefined>();
  const inHost =
    typeof (window as any).nativebridge?.requestToken === "function";

  useEffect(() => {
    const run = async () => {
      if (!inHost) return;
      try {
        const token = await (window as any).nativebridge.requestToken();
        setTokenPreview(token ? token.slice(0, 12) + "…" : undefined);
      } catch (e) {
        console.error("requestToken failed", e);
      }
    };
    run();
  }, [inHost]);

  return (
    <main style={{ padding: 24 }}>
      <h1>My Micro‑App</h1>
      <p>Host detected: {inHost ? "Yes" : "No (browser preview)"}</p>
      <p>Token: {tokenPreview ?? "—"}</p>
      <button
        onClick={async () => {
          try {
            await (window as any).nativebridge?.requestAlert?.({
              title: "Hello",
              message: "Welcome!",
              buttonText: "OK",
            });
          } catch (e) {
            console.log("Alert not available in browser preview");
          }
        }}
      >
        Say Hi
      </button>
    </main>
  );
}
```

3. Run locally for browser preview

```bash
npm run dev
```

Optional: Add a tiny bridge polyfill for browser preview (no host), so your code doesn’t crash:

```ts
// src/bridge-polyfill.ts (import it in main.tsx during local dev only)
declare global {
  interface Window {
    nativebridge?: any;
  }
}

if (!window.nativebridge) {
  window.nativebridge = {
    requestToken: async () => null,
    requestAlert: async ({ title, message }: any) => {
      // Browser fallback
      alert(`${title}: ${message}`);
    },
  };
}
```

Later, you’ll build a ZIP and publish via the Admin Portal so the Super App can download and run it.

---

## Bridge overview

Micro-apps communicate with the host using a lightweight promise-based bridge exposed on `window.nativebridge`.

```js
const data = await window.nativebridge.<bridgeFunction>();
```

Replace `<bridgeFunction>` with the specific method you need.


!!! note
    - See [Available Bridge Methods](./bridge-api.md#available-bridge-functions)
    - All bridge calls are async; always use try/catch.
    - If a request fails, the promise rejects with an error string.

## Naming and conventions

- Request method names follow the `requestXxx` pattern (e.g. `requestUserId`, `requestToken`).
- The host generates corresponding `resolveXxx` / `rejectXxx` handler names automatically; micro-apps only need to call `requestXxx`.
- Avoid touching `window.nativebridge._pendingPromises` or internal fields — only use the documented request functions.

## How to detect the host vs stand-alone web mode

When running in a WebView inside the host, `window.nativebridge` will be available. Protect your code when running in a normal browser:

```js
const inHost = typeof window.nativebridge?.requestToken === "function";
if (inHost) {
  const token = await window.nativebridge.requestToken();
} else {
  // fallback behavior for standalone web preview
}
```

## Packaging & metadata

1. Build your app for production

```bash
npm run build
```

Your output directory will typically be `dist/` (Vite) or `build/` (CRA):

```
dist/ (or build/)
├── assets/
├── index.html
└── ...
```

2. Add a `microapp.json` file at the ROOT of the built output directory with these fields:

```json
{
  "name": "Micro App Name",
  "description": "A brief description of the micro app",
  "appId": "unique-app-id",
  "clientId": "client-id-for-authentication-if-integrated",
  "displayMode": "Controls whether to hide the header ('fullscreen') or show it ('default'). If no value is provided, it defaults to 'default'"
}
```

Field notes

- appId: unique, URL‑safe identifier (e.g., "calendar", "com.example.payroll"). Avoid spaces; use lowercase and dashes.
- displayMode: "default" (shows header) or "fullscreen" (no header, manage your own safe areas).

3. Package as a ZIP

- Important: ZIP the CONTENTS of the build folder, not the folder itself.
  - Good: index.html, assets/, microapp.json at the root of the ZIP
  - Bad: my-app-dist/index.html (nested path inside the ZIP)

---

To Publish via Admin Portal Contact the Adminstrator of the system.



## Local development tips

- Iterate UI in the browser with the bridge polyfill; package/upload when you need to test real bridge flows on device.
- If your API requires auth, use `requestToken()` from the host when running inside the app; in browser preview, use a test token or mock responses.
- Keep CORS minimal; ensure your APIs are reachable from the device running the Super App.

Tip: If your organization needs live‑reload inside the Super App, consider adding an internal “dev” pipeline that rebuilds/hosts ZIPs automatically per commit. The mobile app consumes the latest downloadUrl.

## Security guidance (important)

- Never assume the host will expose full user tokens indefinitely. Always follow least-privilege: request only what you need.
- Avoid storing long‑lived secrets in plain text inside the micro‑app. Use the Super App’s token exchange (`requestToken`) which returns a token scoped for the micro‑app.
- Validate any sensitive operations on the backend; do not rely on client-side checks alone.

## Testing and debugging

- If a bridge request hangs, check native logs to confirm the handler ran and the promise was resolved/rejected.

### Pre‑publish checklist

- [ ] `microapp.json` present at ZIP root and valid
- [ ] appId is unique and URL‑safe
- [ ] version/build updated (build strictly increases)
- [ ] icon/banner reachable (HTTPS)
- [ ] bridge calls guarded for browser preview
- [ ] no secrets committed in source or shipped assets

## Common pitfalls

- Calling `window.nativebridge.requestXxx` without guarding for existence when previewing in a normal browser will throw. Always detect `window.nativebridge`.
- Expect Promise rejections. Wrap in try/catch.
