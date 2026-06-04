"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onUploaded: (result: { url: string; publicId: string }) => void;
  onClear?: () => void;
  type?: "image" | "video";
  className?: string;
}

export function ImageUpload({ value, onUploaded, onClear, type = "image", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      // Route through the same-origin Next.js proxy so the auth cookie is sent
      // and we avoid cross-origin CORS issues. Multipart body sets its own
      // Content-Type boundary, so we don't set headers manually.
      const res = await fetch(`/api-proxy/admin/upload/${type}`, {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { url: string; publicId: string };
        message?: string;
      };
      if (json.success && json.data) onUploaded(json.data);
      else setError(json.message ?? "Upload failed");
    } catch {
      setError("Upload failed. Is the API running?");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className={className}>
      {value ? (
        <div className="relative w-fit">
          {type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Uploaded" className="h-32 w-32 rounded-lg object-cover" />
          ) : (
            <video src={value} className="h-32 w-48 rounded-lg" controls />
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute -right-2 -top-2 rounded-full bg-[#8b1a1a] p-1 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex h-32 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm transition-colors",
            dragging ? "border-[#8b1a1a] bg-[#fbf3e8]" : "border-[#d4c4b0] text-[#9a8b7a] hover:border-[#8b1a1a]"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#8b1a1a]" />
          ) : (
            <>
              <UploadCloud className="h-6 w-6" />
              <span>Click or drag to upload {type}</span>
              <span className="text-xs">JPG, PNG, WebP · max 5MB</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={type === "image" ? "image/jpeg,image/png,image/webp" : "video/*"}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
