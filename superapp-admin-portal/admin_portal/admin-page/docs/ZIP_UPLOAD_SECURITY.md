# ZIP upload security

Scope: simple, reliable checks you can do in the browser without extracting or parsing entries inside the ZIP file. These checks improve security and reduce obvious risks.

## What the Admin SHOULD enforce

1. File extension validation

- Accept only “.zip” (case-insensitive).
- Verify the name in code.

2. MIME type validation (best-effort)

- Check `File.type` is one of:
  - `application/zip`, `application/x-zip-compressed`, or `multipart/x-zip`.
- Note: MIME can be spoofed by the OS or browser; don’t rely on it alone.

3. Magic-number validation (first 4 bytes)

- Read the first 4 bytes and require the ZIP signatures:
  - `50 4B 03 04` (local file header) – typical ZIP start
  - `50 4B 05 06` (end of central directory) – valid for empty ZIPs
- Do not rely on `50 4B 07 08` (data descriptor) since it doesn’t appear at byte 0.

4. File size limit

- Enforce a hard cap.
- Block selection/submit when the file exceeds the limit.

5. HTTPS and host allowlist

- Refuse non-HTTPS endpoints (except localhost for development).
- Only upload to an allowlisted origin you control to avoid token exfiltration.

6. Upload timestamp & uploader ID

- Confirm uploader identity and expected timing (no suspicious or anonymous submissions).

7. Filenames Verification

- no suspicious paths such as:- `../` (directory traversal), absolute paths (`/etc/...`), hidden files (`.bashrc`, `.DS_Store`, `.gitignore`, etc.)

10. Verification of number of files

- flag uploads with hundreds/thousands of entries (potential ZIP bomb).

12. Manual File Spot Check (Safe Types Only)

- If only safe file types are listed (e.g., `.txt`, `.csv`, `.pdf`), extract in a sandboxed environment
- Open a few representative files to confirm legitimate content.
- Ensure no embedded scripts or macros (especially in `.docx`/`.xls`, or PDFs).

13. Anomaly Detection

- MIME type mismatch vs magic number.
- ZIP contains nested archives (`.zip`, `.tar.gz`, `.rar` inside ZIP).
- ZIP is **encrypted** — block unless required by workflow.
- Error responses from the server display concise, non-sensitive messages.
