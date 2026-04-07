"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { PostcodeData, PostcodeIndex } from "../types";

let sharedIndex: PostcodeIndex | null = null;
let fetchPromise: Promise<PostcodeIndex> | null = null;

function fetchIndex(): Promise<PostcodeIndex> {
  if (!fetchPromise) {
    fetchPromise = fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/postcode_index.json`)
      .then((r) => r.json())
      .then((data: PostcodeIndex) => {
        sharedIndex = data;
        return data;
      });
  }
  return fetchPromise;
}

export type PostcodeLookupResult = {
  postcode: string;
  data: PostcodeData;
} | null;

export function usePostcodeIndex(): {
  ready: boolean;
  lookup: (query: string) => PostcodeLookupResult;
  getIndex: () => PostcodeIndex | null;
} {
  const [ready, setReady] = useState(sharedIndex !== null);
  const indexRef = useRef<PostcodeIndex | null>(sharedIndex);

  useEffect(() => {
    if (indexRef.current) return;
    fetchIndex().then((data) => {
      indexRef.current = data;
      setReady(true);
    });
  }, []);

  const lookup = useCallback((query: string): PostcodeLookupResult => {
    const index = indexRef.current;
    if (!index) return null;
    const normalized = query.trim().toUpperCase().replaceAll(/\s/g, "");
    if (!normalized) return null;
    const match = Object.entries(index).find(
      ([k]) => k.replaceAll(/\s/g, "") === normalized
    );
    if (!match) return null;
    return { postcode: match[0], data: match[1] };
  }, []);

  const getIndex = useCallback((): PostcodeIndex | null => {
    return indexRef.current;
  }, []);

  return { ready, lookup, getIndex };
}
