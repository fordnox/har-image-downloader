"use client";

import { useState, useCallback } from "react";

export interface HarImage {
  id: string;
  url: string;
  mimeType: string;
  /** Size in bytes from HAR content size field */
  size: number;
  /** Pixel width, if known */
  width?: number;
  /** Pixel height, if known */
  height?: number;
  dataUrl?: string;
  filename: string;
  selected: boolean;
}

interface HarEntry {
  request: { url: string };
  response: {
    content: {
      mimeType: string;
      size: number;
      text?: string;
      encoding?: string;
    };
    headers?: { name: string; value: string }[];
    bodySize?: number;
  };
}

interface HarFile {
  log: {
    entries: HarEntry[];
  };
}

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/ico",
  "image/x-icon",
]);

function isImageMimeType(mimeType: string): boolean {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return IMAGE_MIME_TYPES.has(base);
}

function getFilenameFromUrl(url: string, mimeType: string): string {
  try {
    const u = new URL(url);
    const pathParts = u.pathname.split("/");
    const last = pathParts[pathParts.length - 1];
    if (last && last.includes(".")) return last;
    const ext = mimeType.split("/")[1]?.split(";")[0] ?? "bin";
    return last ? `${last}.${ext}` : `image.${ext}`;
  } catch {
    return "image.bin";
  }
}

/**
 * Attempt to read pixel dimensions from a base64-encoded image data URL.
 * Returns undefined if not determinable synchronously.
 */
function getDimensionsFromDataUrl(dataUrl: string, mimeType: string): { width: number; height: number } | undefined {
  try {
    // Extract raw base64
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) return undefined;
    const b64 = dataUrl.slice(commaIdx + 1);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const base = mimeType.split(";")[0].trim().toLowerCase();

    // PNG: bytes 16-24 are width (4 bytes) and height (4 bytes)
    if (base === "image/png" && bytes.length >= 24) {
      const view = new DataView(bytes.buffer);
      const w = view.getUint32(16, false);
      const h = view.getUint32(20, false);
      if (w > 0 && h > 0) return { width: w, height: h };
    }

    // JPEG: scan for SOF markers (0xFF 0xC0, 0xFF 0xC2) which contain dimensions
    if ((base === "image/jpeg" || base === "image/jpg") && bytes.length > 4) {
      let offset = 2; // skip SOI
      while (offset + 8 < bytes.length) {
        if (bytes[offset] !== 0xff) break;
        const marker = bytes[offset + 1];
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        // SOF0 = 0xC0, SOF2 = 0xC2
        if ((marker === 0xc0 || marker === 0xc2) && offset + 8 < bytes.length) {
          const h = (bytes[offset + 5] << 8) | bytes[offset + 6];
          const w = (bytes[offset + 7] << 8) | bytes[offset + 8];
          if (w > 0 && h > 0) return { width: w, height: h };
        }
        offset += 2 + segLen;
      }
    }

    // GIF: bytes 6-9 are width (2 bytes LE) and height (2 bytes LE)
    if (base === "image/gif" && bytes.length >= 10) {
      const view = new DataView(bytes.buffer);
      const w = view.getUint16(6, true);
      const h = view.getUint16(8, true);
      if (w > 0 && h > 0) return { width: w, height: h };
    }

    // WebP: check for VP8 / VP8L / VP8X chunks
    if (base === "image/webp" && bytes.length >= 30) {
      // RIFF header: 0-3 = "RIFF", 8-11 = "WEBP"
      const chunkId = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
      if (chunkId === "VP8 " && bytes.length >= 30) {
        // bitstream header offset 20, VP8 frame tag is 3 bytes, then sync code 3 bytes, then 16-bit width/height (low 14 bits)
        const view = new DataView(bytes.buffer);
        const wRaw = view.getUint16(26, true) & 0x3fff;
        const hRaw = view.getUint16(28, true) & 0x3fff;
        if (wRaw > 0 && hRaw > 0) return { width: wRaw, height: hRaw };
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function useHarParser() {
  const [images, setImages] = useState<HarImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    setIsParsing(true);
    setError(null);
    setImages([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const har: HarFile = JSON.parse(raw);

        if (!har?.log?.entries) {
          setError("Invalid HAR file: missing log.entries");
          setIsParsing(false);
          return;
        }

        const found: HarImage[] = [];
        for (const entry of har.log.entries) {
          const mimeType = entry.response?.content?.mimeType ?? "";
          if (!isImageMimeType(mimeType)) continue;

          const url = entry.request?.url ?? "";
          // Prefer bodySize (actual bytes transferred) over content.size (which can be -1)
          const bodySize = entry.response?.bodySize ?? -1;
          const contentSize = entry.response?.content?.size ?? 0;
          const size = bodySize > 0 ? bodySize : contentSize > 0 ? contentSize : 0;

          const text = entry.response?.content?.text;
          const encoding = entry.response?.content?.encoding;
          const id = crypto.randomUUID();
          const filename = getFilenameFromUrl(url, mimeType);
          const baseMime = mimeType.split(";")[0].trim();

          let dataUrl: string | undefined;
          let width: number | undefined;
          let height: number | undefined;

          if (text && encoding === "base64") {
            dataUrl = `data:${baseMime};base64,${text}`;
            const dims = getDimensionsFromDataUrl(dataUrl, baseMime);
            if (dims) {
              width = dims.width;
              height = dims.height;
            }
          }

          found.push({ id, url, mimeType: baseMime, size, width, height, dataUrl, filename, selected: true });
        }

        setImages(found);
        setIsParsing(false);
      } catch (err) {
        setError(`Failed to parse HAR file: ${err instanceof Error ? err.message : String(err)}`);
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setIsParsing(false);
    };
    reader.readAsText(file);
  }, []);

  const toggleImage = useCallback((id: string) => {
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, selected: !img.selected } : img));
  }, []);

  const selectAll = useCallback((ids?: string[]) => {
    setImages((prev) =>
      prev.map((img) => ids ? { ...img, selected: ids.includes(img.id) ? true : img.selected } : { ...img, selected: true })
    );
  }, []);

  const deselectAll = useCallback((ids?: string[]) => {
    setImages((prev) =>
      prev.map((img) => ids ? { ...img, selected: ids.includes(img.id) ? false : img.selected } : { ...img, selected: false })
    );
  }, []);

  const reset = useCallback(() => {
    setImages([]);
    setError(null);
    setFileName(null);
  }, []);

  return { images, error, isParsing, fileName, parseFile, toggleImage, selectAll, deselectAll, reset };
}
