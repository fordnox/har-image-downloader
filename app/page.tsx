"use client";

import { useState } from "react";
import { DropZone } from "@/components/drop-zone";
import { ImageList } from "@/components/image-grid";
import { ImageToolbar } from "@/components/image-toolbar";
import { useHarParser } from "@/hooks/use-har-parser";

export default function Page() {
  const { images, error, isParsing, fileName, parseFile, toggleImage, selectAll, deselectAll, reset } = useHarParser();
  const [minSizeBytes, setMinSizeBytes] = useState(0);

  const hasResults = images.length > 0;

  return (
    <main className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-primary-foreground" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">HAR Image Extractor</h1>
            <p className="text-xs text-muted-foreground">Extract &amp; download images from HAR files</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {!hasResults && !isParsing ? (
          /* Upload view */
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-balance text-foreground">
                Extract images from a HAR file
              </h2>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                Load a HAR capture and instantly see all image responses. Filter by size, select the ones you want, and download them in bulk.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <DropZone onFile={parseFile} />
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground max-w-xl w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* How it works */}
            <div className="mt-4 grid w-full max-w-xl grid-cols-3 gap-4">
              {[
                { icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12", label: "1. Upload", desc: "Drop any .har file" },
                { icon: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18", label: "2. Filter", desc: "Select by file size" },
                { icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3", label: "3. Download", desc: "Save selected images" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-3 py-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-primary" aria-hidden="true">
                    <path d={icon} />
                  </svg>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : isParsing ? (
          /* Parsing state */
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="size-10 animate-spin rounded-full border-2 border-border border-t-primary" role="status" aria-label="Parsing HAR file" />
            <p className="text-sm text-muted-foreground">Parsing HAR file…</p>
          </div>
        ) : (
          /* Results view */
          <div className="flex flex-col gap-4">
            <ImageToolbar
              images={images}
              fileName={fileName}
              minSizeBytes={minSizeBytes}
              onMinSizeChange={setMinSizeBytes}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onReset={reset}
            />

            {images.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-10 text-muted-foreground" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-base font-medium text-foreground">No images found</p>
                <p className="text-sm text-muted-foreground">This HAR file contains no image responses.</p>
              </div>
            ) : (
              <ImageList images={images} onToggle={toggleImage} minSizeBytes={minSizeBytes} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
