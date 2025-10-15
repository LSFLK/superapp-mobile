/**
 * Utilities for working with ZIP files and safely handling server messages.
 */

export const MAX_UPLOAD_MB = Number(process.env.REACT_APP_MAX_UPLOAD_MB ?? "50");
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ZIP_SIGNATURES: number[][] = [
  [0x50, 0x4b, 0x03, 0x04], // local file header (typical)
  [0x50, 0x4b, 0x05, 0x06], // end of central directory (empty zips)
];

export function isZipMagic(buf: ArrayBuffer | null | undefined): boolean {
  if (!(buf instanceof ArrayBuffer) || buf.byteLength < 4) return false;
  const view = new Uint8Array(buf, 0, 4);
  return ZIP_SIGNATURES.some((sig) => sig.every((b, i) => view[i] === b));
}

export async function validateZipFile(
  file: File | null
): Promise<{ ok: boolean; message?: string }> {
  if (!file) return { ok: false, message: "Please choose a ZIP file." };
  if (!/\.zip$/i.test(file.name)) {
    return { ok: false, message: "Selected file must be a .zip archive." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: `File is too large. Max ${MAX_UPLOAD_MB} MB.` };
  }
  // Check magic bytes
  const header = await file
    .slice(0, 4)
    .arrayBuffer()
    .catch(() => null);
  if (!header || !isZipMagic(header)) {
    return { ok: false, message: "File content is not a valid ZIP archive." };
  }
  return { ok: true };
}

export function safeServerMessage(payload: unknown, fallback: string): string {
  try {
    if (!payload) return fallback;
    if (typeof payload === "string") return payload.slice(0, 300);
    if (typeof payload === "object") {
      const anyPayload = payload as Record<string, unknown>;
      const m =
        (anyPayload["message"] as unknown) ||
        (anyPayload["error"] as unknown) ||
        (anyPayload["detail"] as unknown) ||
        (anyPayload["title"] as unknown);
      return String(m ?? fallback).slice(0, 300);
    }
  } catch {}
  return fallback;
}
