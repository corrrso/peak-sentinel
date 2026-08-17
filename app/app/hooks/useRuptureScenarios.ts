"use client";

import { useState, useEffect } from "react";
import type { RuptureScenario } from "../types";

let shared: RuptureScenario[] | null = null;
let fetchPromise: Promise<RuptureScenario[]> | null = null;

function fetchManifest(): Promise<RuptureScenario[]> {
  if (!fetchPromise) {
    fetchPromise = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/rupture/manifest.json`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RuptureScenario[]) => {
        shared = data;
        return data;
      })
      .catch(() => []);
  }
  return fetchPromise;
}

/** Rupture scenarios from the published manifest, worst case first. */
export function useRuptureScenarios(): {
  scenarios: RuptureScenario[];
  defaultId: string | null;
} {
  const [scenarios, setScenarios] = useState<RuptureScenario[]>(shared ?? []);

  useEffect(() => {
    let cancelled = false;
    fetchManifest().then((data) => {
      if (!cancelled) setScenarios(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Default to the full-bore base case affecting the most postcodes, so the
  // map opens on the worst credible scenario. Ordering by area would pick a
  // larger footprint over open ground instead.
  const defaultId =
    scenarios
      .filter((s) => s.mode === "fbr" && !s.variant)
      .toSorted((a, b) => b.postcodes_in_cloud - a.postcodes_in_cloud)[0]?.id ??
    null;

  return { scenarios, defaultId };
}
