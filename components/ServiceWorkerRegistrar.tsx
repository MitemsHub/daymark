"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Register after load so the first visit never competes with page data.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a bonus; a failed registration is silent.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
