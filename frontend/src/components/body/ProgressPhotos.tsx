"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "progress-photos";

interface Photo {
  id: string;
  pose: string | null;
  weightAt: number | null;
  takenAt: string;
  url: string | null;
}

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pose, setPose] = useState<"front" | "side" | "back">("front");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      if (res.ok) setPhotos(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8 MB.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not signed in.");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const key = `${user.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(key, file, {
        upsert: false,
        contentType: file.type,
      });
      if (up.error) {
        setError(up.error.message);
        return;
      }
      const rec = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey: key, pose }),
      });
      if (!rec.ok) {
        const d = await rec.json().catch(() => ({}));
        setError(d.error ?? "Could not save photo");
        return;
      }
      await load();
    } catch {
      setError("Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (res.ok) setPhotos((ps) => ps.filter((p) => p.id !== id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Progress photos</h2>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto"
            value={pose}
            onChange={(e) => setPose(e.target.value as "front" | "side" | "back")}
          >
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
          </select>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="btn-primary whitespace-nowrap"
          >
            {busy ? "Uploading…" : "Add photo"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-fg-subtle">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-fg-subtle">
          No photos yet. Add front/side/back shots to track visual change.
          They&apos;re private to you.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface-2"
            >
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.url}
                  alt={`${p.pose ?? "progress"} photo`}
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[3/4] place-items-center text-xs text-fg-subtle">
                  unavailable
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">
                <span>
                  {p.pose ?? ""} ·{" "}
                  {new Date(p.takenAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => remove(p.id)}
                  disabled={busy}
                  className="rounded bg-black/40 px-1.5 py-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete photo"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
