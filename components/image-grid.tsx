"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { HarImage } from "@/hooks/use-har-parser";

interface ImageListProps {
  images: HarImage[];
  onToggle: (id: string) => void;
  minSizeBytes: number;
}

export function formatSize(bytes: number): string {
  if (bytes <= 0) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Thumbnail({ image }: { image: HarImage }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const src = image.dataUrl ?? image.url;

  if (errored) {
    return (
      <div className="flex size-12 items-center justify-center rounded border border-border bg-muted">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-muted-foreground" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded border border-border bg-muted">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
      <img
        src={src}
        alt=""
        className={cn("size-12 object-cover transition-opacity duration-150", loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        crossOrigin="anonymous"
        loading="lazy"
      />
    </div>
  );
}

function ImageRow({ image, onToggle, dimmed }: { image: HarImage; onToggle: (id: string) => void; dimmed: boolean }) {
  return (
    <tr
      className={cn(
        "group border-b border-border transition-colors last:border-0",
        dimmed ? "opacity-35" : "hover:bg-muted/40",
        image.selected && !dimmed && "bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <td className="w-10 px-4 py-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={image.selected}
          aria-label={`${image.selected ? "Deselect" : "Select"} ${image.filename}`}
          onClick={() => onToggle(image.id)}
          disabled={dimmed}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            image.selected && !dimmed
              ? "border-primary bg-primary"
              : "border-border bg-muted"
          )}
        >
          {image.selected && !dimmed && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="size-2.5 text-primary-foreground" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </td>

      {/* Thumbnail */}
      <td className="w-16 py-2">
        <Thumbnail image={image} />
      </td>

      {/* Filename */}
      <td className="min-w-0 py-2.5 pr-4">
        <p className="truncate text-sm font-medium text-foreground" title={image.filename}>
          {image.filename}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={image.url}>
          {image.url}
        </p>
      </td>

      {/* Type */}
      <td className="hidden whitespace-nowrap py-2.5 pr-6 text-xs text-muted-foreground sm:table-cell">
        {image.mimeType.replace("image/", "").toUpperCase()}
      </td>

      {/* Dimensions */}
      <td className="hidden whitespace-nowrap py-2.5 pr-6 text-xs text-muted-foreground md:table-cell">
        {image.width && image.height ? (
          `${image.width} × ${image.height}`
        ) : (
          <span className="opacity-40">–</span>
        )}
      </td>

      {/* File size */}
      <td className="whitespace-nowrap py-2.5 pr-4 text-right text-xs tabular-nums text-muted-foreground">
        {formatSize(image.size)}
      </td>
    </tr>
  );
}

export function ImageList({ images, onToggle, minSizeBytes }: ImageListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-10" />
          <col className="w-16" />
          <col className="min-w-0" />
          <col className="hidden w-20 sm:table-column" />
          <col className="hidden w-28 md:table-column" />
          <col className="w-20" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="px-4 py-2 text-left">
              <span className="sr-only">Select</span>
            </th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </th>
            <th className="py-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              File
            </th>
            <th className="hidden py-2 pr-6 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
              Type
            </th>
            <th className="hidden py-2 pr-6 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
              Dimensions
            </th>
            <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Size
            </th>
          </tr>
        </thead>
        <tbody>
          {images.map((img) => (
            <ImageRow
              key={img.id}
              image={img}
              onToggle={onToggle}
              dimmed={minSizeBytes > 0 && img.size > 0 && img.size < minSizeBytes}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
