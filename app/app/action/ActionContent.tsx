"use client";

import { useSearchParams } from "next/navigation";
import ObjectionGenerator from "../components/ObjectionGenerator";

export default function ActionContent() {
  const searchParams = useSearchParams();
  const urlPostcode = searchParams.get("postcode");

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* ── Section 1: Objection Generator ────────────────────── */}
      <section>
        <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Take Action</h1>
        <p className="text-gray-300 mb-8">
          Generate a personalised objection letter based on the risks to your
          postcode. Edit freely before sending.
        </p>
        <ObjectionGenerator initialPostcode={urlPostcode} />
      </section>
    </div>
  );
}
