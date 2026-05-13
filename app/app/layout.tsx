import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="h-full flex flex-col bg-black text-white">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
