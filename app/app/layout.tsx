import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peak Sentinel — The Real Impact of Peak Cluster Pipeline",
  description:
    "Interactive map showing environmental, safety, and property value impacts of the proposed Peak Cluster CCS pipeline through Wirral, Cheshire, and the Peak District.",
  openGraph: {
    title: "Peak Sentinel — The Real Impact of Peak Cluster Pipeline",
    description:
      "Interactive map showing environmental, safety, and property value impacts of the proposed Peak Cluster CCS pipeline.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peak Sentinel — The Real Impact of Peak Cluster Pipeline",
    description:
      "Interactive map showing environmental, safety, and property value impacts of the proposed Peak Cluster CCS pipeline.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <header className="flex justify-between md:grid md:grid-cols-3 items-center px-4 py-3 border-b border-[#FFD700]/20 z-50 relative">
          <Link
            href="/"
            className="text-[#FFD700] font-bold text-lg sm:text-xl tracking-wider uppercase"
          >
            Peak Sentinel
          </Link>
          <nav className="flex justify-center gap-3 sm:gap-6 text-sm sm:text-base">
            <Link
              href="/"
              className="text-[#FFD700] hover:text-white transition-colors"
            >
              Map
            </Link>
            <Link
              href="/evidence"
              className="text-[#FFD700] hover:text-white transition-colors"
            >
              Evidence
            </Link>
            <Link
              href="/action"
              className="text-[#FFD700] hover:text-white transition-colors"
            >
              Action
            </Link>
          </nav>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-white/10 px-4 py-8 text-gray-500 text-xs">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                Data Sources
              </span>
              <ul className="mt-1.5 space-y-1">
                <li>
                  Pipeline corridor &amp; AGI sites:{" "}
                  <a
                    href="https://national-infrastructure-consenting.planninginspectorate.gov.uk/projects/EN0710001/documents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    Planning Inspectorate EIA Scoping Report (EN0710001)
                  </a>
                </li>
                <li>
                  Environmental designations (SSSI, SAC, Ancient Woodland):{" "}
                  <a
                    href="https://naturalengland-defra.opendata.arcgis.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    Natural England Open Data
                  </a>
                </li>
                <li>
                  Schools:{" "}
                  <a
                    href="https://get-information-schools.service.gov.uk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    DfE Get Information About Schools (GIAS)
                  </a>
                </li>
                <li>
                  Property prices:{" "}
                  <a
                    href="https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    HM Land Registry Price Paid Data
                  </a>{" "}
                  (2023&ndash;2025 median by outcode)
                </li>
                <li>
                  Topographic sinks &amp; viewshed analysis:{" "}
                  <a
                    href="https://environment.data.gov.uk/survey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    Environment Agency LIDAR Composite DTM (1m)
                  </a>
                </li>
                <li>
                  Basemap:{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    OpenStreetMap
                  </a>{" "}
                  &amp;{" "}
                  <a
                    href="https://carto.com/attributions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    CARTO
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                Official Project Documents
              </span>
              <ul className="mt-1.5 space-y-1">
                <li>
                  <a
                    href="https://national-infrastructure-consenting.planninginspectorate.gov.uk/projects/EN0710001/documents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    EIA Scoping Report Vol. 1 &amp; Vol. 2
                  </a>
                </li>
                <li>
                  <a
                    href="https://peakcluster-consultation.co.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white underline"
                  >
                    Peak Cluster Consultation Website
                  </a>{" "}
                  &mdash; Factsheets, Project Guide, Programme Document,
                  Newsletters
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <p>
                Depreciation estimates are illustrative, based on comparable
                infrastructure studies (see{" "}
                <a
                  href="/evidence"
                  className="text-gray-400 hover:text-white underline"
                >
                  methodology
                </a>
                ). CO&#8322; risk zones are terrain-based visualisations, not
                atmospheric simulations.
              </p>
              <p>
                Inspired by{" "}
                <a
                  href="https://actionagainstccs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white underline"
                >
                  Action Against CCS
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
