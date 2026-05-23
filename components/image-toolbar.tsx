"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { HarImage } from "@/hooks/use-har-parser";
import { formatSize } from "@/components/image-grid";

interface ImageToolbarProps {
  images: HarImage[];
  fileName: string | null;
  minSizeBytes: number;
  onMinSizeChange: (bytes: number) => void;
  onSelectAll: (ids?: string[]) => void;
  onDeselectAll: (ids?: string[]) => void;
  onReset: () => void;
}

// Size filter presets in bytes (0 = no filter)
const SIZE_PRESETS = [
  { label: "All sizes", value: 0 },
  { label: "> 1 KB", value: 1024 },
  { label: "> 5 KB", value: 5 * 1024 },
  { label: "> 10 KB", value: 10 * 1024 },
  { label: "> 50 KB", value: 50 * 1024 },
  { label: "> 100 KB", value: 100 * 1024 },
  { label: "> 500 KB", value: 500 * 1024 },
];

async function downloadImage(image: HarImage): Promise<void> {
  if (image.dataUrl) {
    const a = document.createElement("a");
    a.href = image.dataUrl;
    a.download = image.filename;
    a.click();
    return;
  }
  try {
    const res = await fetch(image.url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = image.filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(image.url, "_blank");
  }
}

export function ImageToolbar({
  images,
  fileName,
  minSizeBytes,
  onMinSizeChange,
  onSelectAll,
  onDeselectAll,
  onReset,
}: ImageToolbarProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Visible = passes the size filter
  const visible = images.filter(
    (img) => minSizeBytes === 0 || img.size <= 0 || img.size >= minSizeBytes
  );
  const visibleIds = visible.map((i) => i.id);

  const selected = images.filter((i) => i.selected);
  // Only count selected images that also pass the current size filter
  const selectedVisible = visible.filter((i) => i.selected);

  const allVisibleSelected = visible.length > 0 && visible.every((i) => i.selected);
  const noneVisibleSelected = selectedVisible.length === 0;

  const handleDownloadAll = async () => {
    if (selectedVisible.length === 0) return;
    setIsDownloading(true);
    for (let i = 0; i < selectedVisible.length; i++) {
      await downloadImage(selectedVisible[i]);
      if (i < selectedVisible.length - 1) {
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    setIsDownloading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: file name + new file */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {fileName && (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-muted-foreground" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="max-w-[220px] truncate text-sm font-medium text-foreground" title={fileName}>
                {fileName}
              </span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{images.length}</span> image{images.length !== 1 ? "s" : ""} found
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
          New file
        </button>
      </div>

      {/* Second row: size filter + select controls + download */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        {/* Left: size filter + select controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Size filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="size-filter" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Min size
            </label>
            <div className="flex flex-wrap gap-1">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onMinSizeChange(preset.value)}
                  className={cn(
                    "rounded px-2 py-1 text-xs transition-colors",
                    minSizeBytes === preset.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />

          {/* Selection controls */}
          <div className="flex items-center gap-1">
            <span className="mr-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedVisible.length}</span>
              {" / "}
              <span>{visible.length}</span>
              {" selected"}
            </span>
            <button
              type="button"
              onClick={() => onSelectAll(visibleIds)}
              disabled={allVisibleSelected}
              className="rounded px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Select all
            </button>
            <span className="text-border" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onDeselectAll(visibleIds)}
              disabled={noneVisibleSelected}
              className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Deselect all
            </button>
          </div>
        </div>

        {/* Right: download button */}
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={noneVisibleSelected || isDownloading}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            noneVisibleSelected || isDownloading
              ? "cursor-not-allowed bg-primary/30 text-primary-foreground/50"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
          )}
        >
          {isDownloading ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 animate-spin" aria-hidden="true">
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
              Downloading…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download {selectedVisible.length > 0 ? `${selectedVisible.length} ` : ""}image{selectedVisible.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
