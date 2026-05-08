"use client";

import ObjectionLetter from "../components/ObjectionLetter";

export default function ActionContent() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      <section>
        <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Take Action</h1>
        <p className="text-gray-300 mb-8">
          Use the letter below to formally object to the Peak Cluster pipeline.
          Copy it and send it to the relevant authorities.
        </p>
        <ObjectionLetter />
      </section>
    </div>
  );
}
