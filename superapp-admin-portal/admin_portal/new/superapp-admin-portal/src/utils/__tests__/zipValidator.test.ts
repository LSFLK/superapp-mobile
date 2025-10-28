/**
 * ZIP Validator Tests
 *
 * Tests for the ZIP file validation utility
 */

import { describe, it, expect } from "vitest";
import {
  validateZipFile,
  isZipExtension,
  formatFileSize,
  getMaxFileSize,
} from "../zipValidator";

describe("zipValidator", () => {
  describe("isZipExtension", () => {
    it("should validate .zip extension", () => {
      expect(isZipExtension("test.zip")).toBe(true);
      expect(isZipExtension("test.ZIP")).toBe(true);
      expect(isZipExtension("test.Zip")).toBe(true);
    });

    it("should reject non-zip extensions", () => {
      expect(isZipExtension("test.txt")).toBe(false);
      expect(isZipExtension("test.rar")).toBe(false);
      expect(isZipExtension("test.tar.gz")).toBe(false);
      expect(isZipExtension("test")).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(100)).toBe("100 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });
  });

  describe("getMaxFileSize", () => {
    it("should return max file size limits", () => {
      const limits = getMaxFileSize();
      expect(limits).toHaveProperty("bytes");
      expect(limits).toHaveProperty("mb");
      expect(limits.bytes).toBeGreaterThan(0);
      expect(limits.mb).toBeGreaterThan(0);
    });
  });

  describe("validateZipFile", () => {
    it("should reject null file", async () => {
      const result = await validateZipFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject non-zip extension", async () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const result = await validateZipFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });

    it("should reject file that is too small", async () => {
      const file = new File([new Uint8Array(10)], "test.zip", {
        type: "application/zip",
      });
      const result = await validateZipFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too small");
    });

    it("should reject invalid ZIP signature", async () => {
      // Create a file with wrong magic bytes
      const content = new Uint8Array(100);
      content[0] = 0xff;
      content[1] = 0xff;
      content[2] = 0xff;
      content[3] = 0xff;

      const file = new File([content], "test.zip", { type: "application/zip" });
      const result = await validateZipFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not a valid ZIP");
    });

    it("should accept valid ZIP with correct signature", async () => {
      // Create a minimal valid ZIP file
      // PK\x03\x04 header + minimal central directory
      const header = new Uint8Array([
        0x50,
        0x4b,
        0x03,
        0x04, // Local file header signature
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        // End of central directory
        0x50,
        0x4b,
        0x05,
        0x06, // End signature
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);

      const file = new File([header], "test.zip", { type: "application/zip" });
      const result = await validateZipFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
