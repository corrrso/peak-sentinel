"use client";

import { useEffect } from "react";

export default function IframeResizer() {
  useEffect(() => {
    function postHeight() {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "resize", height }, "*");
    }

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, []);

  return null;
}
