"use client";

import { useState } from "react";

const LETTER_TEXT = `I write to formally object to the proposed Peak Cluster carbon capture and storage pipeline.

This project presents unacceptable risks across safety, environmental protection, and long term accountability. The proposed route cuts through highly sensitive landscapes, including over 50 Sites of Special Scientific Interest. These are not expendable corridors. They are legally protected environments of national importance. The disruption, excavation, and permanent presence of infrastructure through these areas pose a clear and irreversible threat to biodiversity, habitats, and ecological stability.

From a safety perspective, the transportation of CO\u2082 at this scale and distance introduces risks that are not yet fully understood or properly regulated within the UK. There is no established framework that adequately addresses pipeline failure, topographical impact, or emergency response planning for communities along the route. The consequences of a rupture, particularly in populated or low lying areas, are serious and cannot be dismissed.

Environmentally, this project does not represent genuine decarbonisation. It risks prolonging reliance on high emission industrial processes under the guise of mitigation. It diverts focus and funding away from sustainable alternatives and creates long term infrastructure with uncertain liability and monitoring burdens.

There are also serious concerns regarding transparency and public engagement. The consultation process has failed to provide clear, consistent, and complete information, particularly on key issues such as CO\u2082 transportation and long term storage integrity.

The risks are too great, the benefits overstated, and the impacts too significant to ignore.

I urge you to oppose this proposal in its entirety.`;

export default function ObjectionLetter() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(LETTER_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/8 border border-white/10 rounded-lg p-6">
        <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
          {LETTER_TEXT}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="bg-[#FFD700] text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition-colors text-sm"
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>
    </div>
  );
}
