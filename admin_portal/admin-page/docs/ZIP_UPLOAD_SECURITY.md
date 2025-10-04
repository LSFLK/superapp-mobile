# ZIP upload security 

Scope: simple, reliable checks you can do in the browser without extracting or parsing entries inside the ZIP file. These checks improve UX and reduce obvious risks but do not replace server-side validation.

## What the frontend SHOULD enforce

1) File extension validation

- Accept only “.zip” (case-insensitive).
- Use the file input accept filter and verify the name in code.

2) MIME type validation (best-effort)

- Check `File.type` is one of:
  - `application/zip`, `application/x-zip-compressed`, or `multipart/x-zip`.
- Note: MIME can be spoofed by the OS or browser; don’t rely on it alone.

3) Magic-number validation (first 4 bytes)

- Read the first 4 bytes and require the ZIP signatures:
  - `50 4B 03 04` (local file header) – typical ZIP start
  - `50 4B 05 06` (end of central directory) – valid for empty ZIPs
- Do not rely on `50 4B 07 08` (data descriptor) since it doesn’t appear at byte 0.

4) File size limit

- Enforce a hard cap (for example `REACT_APP_MAX_UPLOAD_MB`, default 50 MB).
- Block selection/submit when the file exceeds the limit; show a clear message.

5) HTTPS and host allowlist

- Refuse non-HTTPS endpoints (except localhost for development).
- Only upload to an allowlisted origin you control to avoid token exfiltration.

6) Safe UX and error handling

- Don’t set `Content-Type` manually for `FormData`; let the browser set boundaries.
- Parse JSON or text errors; show concise user-facing messages (no stack traces).
- Never log tokens or sensitive values in production.

## Testing checklist

- Valid ZIP under the size cap uploads successfully.
- Non-ZIP (e.g., renamed `.zip`) is blocked by magic-number check.
- Oversized ZIP is blocked with a clear message.
- Uploads to non-HTTPS (non-localhost) are blocked in development builds.
- Error responses from the server display concise, non-sensitive messages.

## Environment knobs

- `REACT_APP_MAX_UPLOAD_MB`: numeric megabytes cap (e.g., 50). Changing this requires a rebuild.
