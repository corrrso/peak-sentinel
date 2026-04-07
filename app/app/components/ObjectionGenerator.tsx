"use client";

import { useState, useEffect, useRef } from "react";
import type { PostcodeData } from "../types";
import { usePostcodeIndex } from "../hooks/usePostcodeIndex";

type Template = {
  title: string;
  text: string;
  condition?: string;
};

type Templates = Record<string, Template>;

const OPTIONAL_SECTIONS = [
  { key: "topo_sink", label: "CO\u2082 pooling risk (topographic sink)" },
  { key: "viewshed", label: "Visual impact (Coastal AGI viewshed)" },
  { key: "nearby_env", label: "Nearby protected sites" },
  { key: "nearby_schools", label: "Nearby schools" },
] as const;

function buildSectionText(
  key: string,
  data: PostcodeData,
  tmpl: Templates
): string | null {
  switch (key) {
    case "topo_sink": {
      if (!tmpl.topo_sink) return null;
      if (data.sink_depth_m != null) {
        return tmpl.topo_sink.text.replace(
          "{sink_depth_m}",
          String(data.sink_depth_m)
        );
      }
      return tmpl.topo_sink.text.replace(
        " (estimated depth ~{sink_depth_m}m below surrounding terrain)",
        ""
      );
    }
    case "viewshed": {
      if (!tmpl.viewshed) return null;
      return tmpl.viewshed.text;
    }
    case "property_impact": {
      if (!tmpl.property_impact) return null;
      return tmpl.property_impact.text
        .replace(
          "{depreciation_pct}",
          String(Math.floor(Math.abs(data.est_depreciation_pct)))
        )
        .replace(/\s*\(estimated loss[^)]*\)/i, "")
        .replace(/\s*\(\u00A3\{est_loss_gbp[^}]*\}[^)]*\)/i, "")
        .replace("\u00A3{est_loss_gbp:,}", "");
    }
    case "nearby_env": {
      if (!tmpl.nearby_env) return null;
      return tmpl.nearby_env.text.replace(
        "{nearby_env_list}",
        data.nearby_env.join(", ")
      );
    }
    case "nearby_schools": {
      if (!tmpl.nearby_schools) return null;
      return tmpl.nearby_schools.text.replace(
        "{nearby_schools_list}",
        data.nearby_schools.join(", ")
      );
    }
    default: {
      return null;
    }
  }
}

function isSectionAvailable(key: string, data: PostcodeData): boolean {
  switch (key) {
    case "topo_sink": {
      return data.in_topo_sink;
    }
    case "viewshed": {
      return data.in_viewshed;
    }
    case "nearby_env": {
      return data.nearby_env.length > 0;
    }
    case "nearby_schools": {
      return data.nearby_schools.length > 0;
    }
    default: {
      return false;
    }
  }
}

function assembleLetter(
  pc: string,
  data: PostcodeData,
  tmpl: Templates,
  sectionToggles: Record<string, boolean>,
  name: string,
  address: string
): string {
  const sections: string[] = [
    tmpl.intro.text.replace("{postcode}", pc),
  ];

  const approxDistance = Math.ceil(data.distance_m / 50) * 50;
  sections.push(
    tmpl.proximity.text.replace("{distance_m}", String(approxDistance))
  );

  for (const { key } of OPTIONAL_SECTIONS) {
    if (sectionToggles[key]) {
      const text = buildSectionText(key, data, tmpl);
      if (text) sections.push(text);
    }
  }

  if (data.est_depreciation_pct < 0) {
    const text = buildSectionText("property_impact", data, tmpl);
    if (text) sections.push(text);
  }

  let closing = tmpl.closing.text;
  closing = closing.replace("[Your name]", name || "[Your name]");
  closing = closing.replace("[Your address]", address || "[Your address]");
  sections.push(closing);

  return sections.join("\n\n");
}

export default function ObjectionGenerator({
  initialPostcode,
}: {
  initialPostcode?: string | null;
}) {
  const { ready: indexReady, lookup } = usePostcodeIndex();
  const templatesRef = useRef<Templates | null>(null);
  const [templatesReady, setTemplatesReady] = useState(false);
  const [result, setResult] = useState<PostcodeData | null>(null);
  const [postcode, setPostcode] = useState("");
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const lastSearchedRef = useRef<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/objection_templates.json`)
      .then((r) => r.json())
      .then((tmpl: Templates) => {
        templatesRef.current = tmpl;
        setTemplatesReady(true);
      });
  }, []);

  const ready = indexReady && templatesReady;

  function doSearch(pc: string) {
    const templates = templatesRef.current;
    if (!templates) return;

    const match = lookup(pc);
    if (match) {
      setPostcode(match.postcode);
      setResult(match.data);

      const newToggles: Record<string, boolean> = {};
      for (const { key } of OPTIONAL_SECTIONS) {
        newToggles[key] = isSectionAvailable(key, match.data);
      }
      setToggles(newToggles);
      setLetter(assembleLetter(match.postcode, match.data, templates, newToggles, userName, userAddress));
    }
  }

  function rebuildLetter(
    overrideToggles?: Record<string, boolean>,
    overrideName?: string,
    overrideAddress?: string
  ) {
    if (!result || !templatesRef.current) return;
    setLetter(
      assembleLetter(
        postcode,
        result,
        templatesRef.current,
        overrideToggles ?? toggles,
        overrideName ?? userName,
        overrideAddress ?? userAddress
      )
    );
  }

  // Re-search whenever initialPostcode changes
  useEffect(() => {
    if (initialPostcode && ready && initialPostcode !== lastSearchedRef.current) {
      lastSearchedRef.current = initialPostcode;
      doSearch(initialPostcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostcode, ready]);

  function handleToggle(key: string) {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    rebuildLetter(newToggles);
  }

  function handleNameChange(value: string) {
    setUserName(value);
    rebuildLetter(undefined, value);
  }

  function handleAddressChange(value: string) {
    setUserAddress(value);
    rebuildLetter(undefined, undefined, value);
  }

  function handleCopy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `objection-${postcode.replaceAll(/\s/g, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sectionStates = OPTIONAL_SECTIONS.map(({ key, label }) => ({
    key,
    label,
    enabled: !!toggles[key],
    available: result ? isSectionAvailable(key, result) : false,
  }));

  if (!ready) {
    return <p className="text-gray-500">Loading data...</p>;
  }

  const formReady = result && userName.trim() && userAddress.trim();

  return (
    <div className="space-y-6">
      {/* Name, address, toggles */}
      <div className="bg-white/8 border border-white/10 rounded-lg p-4 space-y-3">
        <input
          type="text"
          value={userName}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Your name"
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
        />
        <input
          type="text"
          value={userAddress}
          onChange={(event) => handleAddressChange(event.target.value)}
          placeholder="Your first line of address (e.g. 30 Bold Street)"
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
        />

        {/* Section toggles */}
        {result && (
          <div className="pt-3 border-t border-white/10">
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
              Include in letter
            </div>
            {sectionStates.map(({ key, label, enabled, available }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer py-0.5"
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleToggle(key)}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#FFD700] accent-[#FFD700] focus:ring-[#FFD700] focus:ring-offset-0"
                />
                <span
                  className={`text-sm ${
                    enabled ? "text-white" : "text-gray-500"
                  }`}
                >
                  {label}
                  {!available && (
                    <span className="text-gray-600 text-xs ml-1">
                      (not suggested for your postcode)
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Generated letter */}
      {formReady ? (
        <div className="space-y-3">
          <textarea
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
            className="w-full h-96 bg-white/8 border border-white/20 rounded p-4 text-gray-200 text-sm leading-relaxed resize-y focus:outline-none focus:border-[#FFD700]"
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="bg-[#FFD700] text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition-colors text-sm"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleDownload}
              className="bg-white/10 border border-white/20 text-white font-bold px-4 py-2 rounded hover:bg-white/20 transition-colors text-sm"
            >
              Download as .txt
            </button>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="text-[#FFD700] text-sm font-bold">
              Where to send your objection
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://national-infrastructure-consenting.planninginspectorate.gov.uk/projects/EN0710001"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Submit to Planning Inspectorate (EN0710001) &rarr;
              </a>
              <a
                href="https://www.writetothem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Write to your MP &rarr;
              </a>
              <a
                href="https://www.writetothem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Write to your local councillor &rarr;
              </a>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Enter your name and address to generate your letter.
        </p>
      )}
    </div>
  );
}
