import type { Metadata } from "next";
import { Suspense } from "react";
import ActionContent from "./ActionContent";

export const metadata: Metadata = {
  title: "Take Action — Peak Sentinel",
  description:
    "Generate a personalised objection letter for the Peak Cluster CO2 pipeline. Key dates, contacts, and how to get involved.",
};

export default function ActionPage() {
  return (
    <Suspense>
      <ActionContent />
    </Suspense>
  );
}
