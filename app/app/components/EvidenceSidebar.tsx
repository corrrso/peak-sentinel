"use client";

import { useState, useEffect, useCallback } from "react";

const SECTIONS = [
  { id: "physics", label: "Physics of CO\u2082 Failure" },
  { id: "ccs-track-record", label: "CCS Track Record" },
  { id: "webinar", label: "Webinar Admissions" },
  { id: "import-terminal", label: "CO\u2082 Import Terminal" },
  { id: "planning-inspectorate", label: "Planning Inspectorate" },
  { id: "satartia", label: "Satartia Incident" },
  { id: "sulphur", label: "Sulphur, Louisiana" },
  { id: "holcim", label: "Holcim / Lafarge" },
];

export default function EvidenceSidebar() {
  const [activeId, setActiveId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  /* ── Scroll-spy ──────────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── Scroll to section ───────────────────────────────────── */
  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsOpen(false);
      }
    },
    [],
  );

  /* ── Close on Escape ─────────────────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  /* ── Body scroll lock (mobile drawer only) ───────────────── */
  useEffect(() => {
    if (isOpen && window.matchMedia("(max-width: 1023px)").matches) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  /* ── Section list (shared between desktop and mobile) ───── */
  const sectionList = (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <button
              onClick={() => scrollTo(id)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded transition-colors ${
                activeId === id
                  ? "text-white border-l-2 border-[#FFD700] bg-white/5"
                  : "text-gray-500 hover:text-gray-300 border-l-2 border-transparent"
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* ── Desktop: always-visible sidebar ───────────────────── */}
      <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <div
          id="sidebar-panel"
          className="bg-black/85 backdrop-blur-md border border-white/10 border-l-0 rounded-r-xl p-4 pr-5 min-w-[220px]"
        >
          <div className="text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-3">
            Contents
          </div>
          {sectionList}
        </div>
      </div>

      {/* ── Mobile: TOC button + slide-in drawer ─────────────── */}
      <div className="lg:hidden">
        {/* Sticky TOC button */}
        <button
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="mobile-drawer"
          className="fixed top-20 left-4 z-40 bg-black/90 backdrop-blur border border-[#FFD700]/30 rounded-full px-3 py-2 flex items-center gap-2 shadow-lg shadow-black/50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-[#FFD700]"
          >
            <path
              d="M2 4h12M2 8h8M2 12h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[#FFD700] text-xs font-bold">Contents</span>
        </button>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Table of contents"
          className={`fixed top-0 left-0 bottom-0 w-72 bg-black/95 backdrop-blur-md border-r border-white/10 z-50 p-6 pt-8 transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-[#FFD700] text-sm font-bold uppercase tracking-wider">
              Contents
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close table of contents"
              className="text-gray-500 hover:text-white text-xl leading-none"
            >
              &times;
            </button>
          </div>
          {sectionList}
        </div>
      </div>
    </>
  );
}
