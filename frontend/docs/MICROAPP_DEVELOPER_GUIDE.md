# Micro-app Developer Guide

This guide helps you build a micro-app that runs inside Super App Mobile's WebView host. It focuses on the promise-based bridge API, onboarding, local development, and best practices for secure and reliable apps.

## Example

For a practical example, refer to the `payslip viewer` micro-app implementation.

## Bridge overview

Micro-apps communicate with the host using a lightweight promise-based bridge exposed on `window.nativebridge`.

```js
const data = await window.nativebridge.<bridgeFunction>();
```

Replace `<bridgeFunction>` with the specific method you need (see examples below).

Common bridge methods (examples)

- Get currently authenticated user id:

```js
const userId = await window.nativebridge.requestUserId();
```

- Get the current auth token (if available):

```js
const token = await window.nativebridge.requestToken();
```

- Request a micro-app specific token (host will return a token scoped to your micro-app):

```js
// The host uses the app id you were launched with
const tokenData = await window.nativebridge.requestMicroAppToken();
// tokenData: { token, expiresAt, app_id }
```

- Save or read local data via the host's AsyncStorage bridge:

```js
await window.nativebridge.requestSaveLocalData({ key: 'prefs', value: JSON.stringify({ dark: true }) });
const { value } = await window.nativebridge.requestGetLocalData({ key: 'prefs' });
```

- Show a native alert or confirmation dialog:

```js
await window.nativebridge.requestAlert({ title: 'Hello', message: 'Welcome', buttonText: 'OK' });
const choice = await window.nativebridge.requestConfirmAlert({ title: 'Delete', message: 'Confirm delete?', cancelButtonText: 'No', confirmButtonText: 'Yes' });
// choice is 'confirm' or 'cancel'
```

Notes
- If a request fails, the promise will reject with an error string. Wrap calls in try/catch when appropriate.

## Naming and conventions

- Request method names follow the `requestXxx` pattern (e.g. `requestUserId`, `requestToken`).
- The host generates corresponding `resolveXxx` / `rejectXxx` handler names automatically; micro-apps only need to call `requestXxx`.
- Avoid touching `window.nativebridge._pendingPromises` or internal fields — only use the documented request functions.

## How to detect the host vs stand-alone web mode

When running in a WebView inside the host, `window.nativebridge` will be available. Protect your code when running in a normal browser:

```js
const inHost = typeof window.nativebridge?.requestUserId === 'function';
if (inHost) {
  const userId = await window.nativebridge.requestUserId();
} else {
  // fallback behavior for standalone web preview
}
```

## Onboarding 

Each micro-app should include a small manifest or metadata so the Super App can display it in the catalog. Typical fields:

- `app_id` (string) — unique identifier assigned by the host
- `name` (string) — display name
- `description` (string) — short description
- `icon` (URL or local path) — square icon used in the catalog
- `entry` (index.html/htm) — where the host should load the micro-app (for dev this may be localhost url)

<!-- Place this metadata in `microapps/<your-app>/manifest.json` or follow the repository's micro-app packaging conventions. -->

## Local development tips

- Use a local dev server and, if testing on a device, expose it with a tunnel (e.g. ngrok) and configure the host to point to the tunnel URL.
- Keep CORS minimal — the WebView typically allows local host connections but ensure APIs the micro-app calls are reachable from the host device.

## Security guidance (important)

- Never assume the host will expose full user tokens indefinitely. Always follow least-privilege: request only what you need.
- Avoid storing long-lived secrets in plain text inside the micro-app. Use the host's token exchange (`requestMicroAppToken`) which returns a token scoped for the micro-app.
- Validate any sensitive operations on the backend; do not rely on client-side checks alone.
- Do not attempt to read other micro-app's data via localStorage; use provided bridge methods instead.

## Testing and debugging

- If a bridge request hangs, check that the host received the message and look for any errors in the native logs.

## Common pitfalls

- Calling `window.nativebridge.requestXxx` without guarding for existence when previewing in a normal browser will throw. Always detect `window.nativebridge`.
- Expect Promise rejections. Wrap in try/catch.
- If your micro-app needs an app-scoped token, call `requestMicroAppToken()` instead of asking for the host's global auth token.

## API reference (host-provided methods — summary)

- `requestUserId(): Promise<string>` — returns current user id
- `requestToken(): Promise<string|null>` — returns auth token if available
- `requestMicroAppToken(): Promise<{ token: string, expiresAt: string, app_id: string }>` — returns micro-app token
- `requestSaveLocalData({ key, value }): Promise<void>` — saves to host storage
- `requestGetLocalData({ key }): Promise<{ value: string | null }>` — reads from host storage
- `requestAlert({ title, message, buttonText }): Promise<void>` — shows alert
- `requestConfirmAlert({ title, message, cancelButtonText, confirmButtonText }): Promise<'confirm'|'cancel'>` — shows confirmation dialog
- `requestQr(): Promise<void>` — opens native QR scanner (result via separate bridge or saved state)

(See `frontend/docs/BRIDGE_GUIDE.md` for more detailed examples and the full registry.)

