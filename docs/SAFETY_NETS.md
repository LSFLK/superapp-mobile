# Built-in Safety Nets

This document summarizes the security and resilience protections already implemented in this repository so deployers know what is covered out-of-the-box.

## Mobile app (frontend)

- WebView safety measures (currently in use)
  - Origin validation for bridge messages via `validateMessageOrigin` in `utils/webViewSecurity.ts`
  - Bridge access allowlist (`allowedBridgeOrigins`) with robust `file://` normalization for iOS/Android paths
  - Navigation guard using `onShouldStartLoadWithRequest` + `isNavigationAllowed`; logs and blocks unauthorized navigations
  - `allowUniversalAccessFromFileURLs={false}` and `allowFileAccessFromFileURLs={false}` to prevent cross-file access
  - `allowFileAccess` controlled by policy: enabled only for local (file-based) micro‑apps
  - `originWhitelist={['*']}` intentionally to allow API calls while bridge access remains strictly validated
  - Current URL tracking via `onNavigationStateChange` for contextual origin checks
  - Message sanitization (`sanitizeBridgeMessage`) to reduce prototype‑pollution payloads without blocking valid data
  - Optional pre-content JS injection (CSP stubs) via `injectedJavaScriptBeforeContentLoaded` if needed
- Per‑micro‑app access tokens
  - Tokens issued per app/user with expiry; scoped to micro‑app backends
  - Cached with expiry and cleared on logout/uninstall
- Logout cleanup and state reset
  - Redux persist purge and AsyncStorage cleanup for `AUTH_DATA`, `USER_INFO`, and micro‑app tokens
  - Error‑tolerant flow to ensure user is returned to Login
- Caching and storage hygiene
  - Namespaced keys for micro‑app tokens
  - Planned migration to hardware‑backed SecureStore for sensitive tokens (see Future Improvements)

## Backend (Ballerina)

- JWT authorization interceptor
  - Validates issuer and audiences; signature verified using configured public key
  - Role/group extraction and endpoint role mapping (`superapp_admin` for uploads)
- Error response interceptor
  - Sanitizes payload binding errors and avoids leaking internals
- Parameterized SQL queries
  - Uses `sql:ParameterizedQuery` to prevent SQL injection in DB interactions
- Request limits
  - Server configured with request header size limits (`requestLimits: { maxHeaderSize }`)
- CORS configuration
  - Centralized configuration (currently permissive in dev) with headers/methods allowlists; to be locked down in prod per environment

## Admin portal and sample apps

- Auth via IdP SDKs (OIDC flows)
- Dev‑only proxies for CORS during local development (documented as non‑production)
- Diagnostics and debug components isolated; to be gated by environment flags


For a prioritized roadmap of pending items, see `docs/FUTURE_IMPROVEMENTS.md`.
