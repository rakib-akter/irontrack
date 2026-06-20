"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { scaleNutrients, type Nutrients } from "@/lib/nutrition";

interface Product {
  found: boolean;
  code?: string;
  name?: string;
  brand?: string | null;
  servingGrams?: number | null;
  per100?: Nutrients;
}

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export default function BarcodeScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [grams, setGrams] = useState("");
  const [mealType, setMealType] = useState<Meal>("snack");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => controlsRef.current?.stop();
  }, []);

  async function startScan() {
    setError(null);
    setScanning(true);
    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, _err, controls) => {
          if (result) {
            const text = result.getText();
            controls.stop();
            setScanning(false);
            setCode(text);
            void lookup(text);
          }
        },
      );
    } catch {
      setScanning(false);
      setError("Couldn't access the camera. Enter the barcode manually.");
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    setScanning(false);
  }

  async function lookup(value?: string) {
    const c = (value ?? code).trim();
    if (!c) return;
    setError(null);
    setBusy(true);
    setProduct(null);
    try {
      const res = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lookup failed");
        return;
      }
      if (!data.found) {
        setError("Product not found in the database.");
        return;
      }
      setProduct(data);
      setGrams(String(data.servingGrams ?? 100));
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!product?.per100) return;
    setBusy(true);
    setError(null);
    try {
      const g = grams ? Number(grams) : 100;
      const nutrients = scaleNutrients(product.per100, g);
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.brand ? `${product.name} (${product.brand})` : product.name,
          grams: g,
          nutrients,
          mealType,
          source: "barcode",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not save");
        return;
      }
      setProduct(null);
      setCode("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Barcode</h2>
        <select
          className="input w-auto"
          value={mealType}
          onChange={(e) => setMealType(e.target.value as Meal)}
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {scanning && (
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="h-48 w-full object-cover" />
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="input"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Barcode number"
        />
        {scanning ? (
          <button type="button" onClick={stopScan} className="btn-ghost whitespace-nowrap">
            Stop
          </button>
        ) : (
          <button type="button" onClick={startScan} className="btn-ghost whitespace-nowrap">
            📷 Scan
          </button>
        )}
        <button
          type="button"
          onClick={() => lookup()}
          disabled={busy || !code.trim()}
          className="btn-primary whitespace-nowrap"
        >
          Look up
        </button>
      </div>

      {product?.found && product.per100 && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="font-medium">{product.name}</p>
          {product.brand && (
            <p className="text-xs text-fg-subtle">{product.brand}</p>
          )}
          <p className="mt-1 text-xs text-fg-muted">
            {product.per100.calories} kcal · {product.per100.proteinG}p{" "}
            {product.per100.carbsG}c {product.per100.fatG}f per 100g
          </p>
          <div className="mt-3 flex gap-2">
            <input
              className="input w-28"
              type="number"
              min="1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="grams"
            />
            <button onClick={add} disabled={busy} className="btn-primary flex-1">
              {busy ? "Adding…" : "Add to log"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <p className="text-xs text-fg-subtle">
        Powered by Open Food Facts. Scanning needs a camera; otherwise type the
        number.
      </p>
    </div>
  );
}
