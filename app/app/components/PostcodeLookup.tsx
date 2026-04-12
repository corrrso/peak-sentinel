"use client";

import { useState, useEffect, useRef } from "react";
import type { PostcodeData } from "../types";
import { usePostcodeIndex } from "../hooks/usePostcodeIndex";

interface PostcodeLookupProps {
  onResult: (postcode: string, data: PostcodeData) => void;
  onFlyTo: (coords: { longitude: number; latitude: number }) => void;
  initialPostcode?: string | null;
}

export default function PostcodeLookup({ onResult, onFlyTo, initialPostcode }: PostcodeLookupProps) {
  const [query, setQuery] = useState(initialPostcode || "");
  const [error, setError] = useState<string | null>(null);
  const { ready, lookup } = usePostcodeIndex();
  const autoSearched = useRef(false);

  function doSearch(searchQuery: string) {
    setError(null);
    const result = lookup(searchQuery);
    if (result) {
      onResult(result.postcode, result.data);
      onFlyTo({ longitude: result.data.lon, latitude: result.data.lat });
    } else if (searchQuery.trim()) {
      setError("Postcode not found in our database. Try a nearby postcode.");
    }
  }

  useEffect(() => {
    if (initialPostcode && ready && !autoSearched.current) {
      autoSearched.current = true;
      doSearch(initialPostcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostcode, ready]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="hidden md:block text-[#FFD700] text-lg font-bold">
        Is your home at risk?
      </h3>
      <p className="hidden md:block text-gray-400 text-sm">
        Enter your postcode to see how the Peak Cluster pipeline affects you
      </p>
      <div className="flex gap-2 md:mt-1">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && doSearch(query)}
          placeholder="e.g. CH47 3BX, SK17 6TH"
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
        />
        <button
          onClick={() => doSearch(query)}
          disabled={!ready}
          className="bg-[#FFD700] text-black px-5 py-2.5 rounded-lg text-base font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          Check
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
