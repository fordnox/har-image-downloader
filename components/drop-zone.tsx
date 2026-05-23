"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
}

export function DropZone({ onFile }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop zone: click or drag a HAR file here"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 transition-all duration-200 select-none",
        dragging
          ? "border-primary bg-primary/10 scale-[1.01]"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".har,application/json"
        className="sr-only"
        onChange={handleChange}
        aria-hidden="true"
      />

      {/* Icon */}
      <div className={cn(
        "flex size-16 items-center justify-center rounded-xl transition-colors",
        dragging ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
      )}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("size-8 transition-colors", dragging ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <div className="text-center">
        <p className={cn("text-base font-medium transition-colors", dragging ? "text-primary" : "text-foreground")}>
          {dragging ? "Drop it here" : "Drop your HAR file here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or <span className="text-primary underline underline-offset-2">click to browse</span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground/60">.har files only</p>
      </div>
    </div>
  );
}
