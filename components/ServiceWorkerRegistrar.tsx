"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // The Pages build inlines /daymark here; local and Vercel get "".
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const register = () => {
      navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
        // Offline support is a bonus; a failed registration is silent.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
