"use client";

import { useEffect } from "react";

const SUFFIX = "AI Coach Dashboard";

/**
 * Sets the browser document title for a client page (these are client
 * components, so they can't export Next `metadata`). Helps orientation and is
 * announced by screen readers on navigation.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${SUFFIX}` : SUFFIX;
  }, [title]);
}
