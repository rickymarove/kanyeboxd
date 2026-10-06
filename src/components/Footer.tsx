"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-6 mt-auto text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted/70 tracking-tight">
        <span className="font-semibold text-text-muted">
          kanyeboxd
        </span>
        <span>
          &copy; 2026 Ricky Marove. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
