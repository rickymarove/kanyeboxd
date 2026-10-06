"use client";

import React from "react";
import { Disc3, Search, Heart, Star, Plus } from "lucide-react";
import { UserStats } from "@/lib/types";

interface NavbarProps {
  stats: UserStats;
  activeFilter: "all" | "rated" | "unrated" | "favorites";
  onFilterChange: (filter: "all" | "rated" | "unrated" | "favorites") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal?: () => void;
}

export function Navbar({
  stats,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-surface-raised border border-border flex items-center justify-center text-amber shadow-sm">
              <Disc3 className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold tracking-widest text-text-primary uppercase">
                  Kanyeboxd
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber" />
              </div>
              <p className="text-[11px] text-text-muted font-mono tracking-tight hidden sm:block">
                Private Listening Journal & Vault
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search albums, artists, genres..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/50 transition-all font-sans"
            />
          </div>

          {/* Action / Stats pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-md bg-surface border border-border text-xs font-mono text-text-secondary">
              <span>
                <strong className="text-text-primary">{stats.totalRated}</strong> rated
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber fill-amber" />
                <strong className="text-text-primary">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                </strong> avg
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-crimson fill-crimson" />
                <strong className="text-text-primary">{stats.favoriteCount}</strong> favs
              </span>
            </div>

            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-raised hover:bg-surface-hover border border-border hover:border-amber/50 text-xs font-medium text-text-primary transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber" />
                <span>Add Release</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar & Mobile Search */}
        <div className="py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border-subtle">
          {/* Mobile Search */}
          <div className="relative md:hidden w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-8 pl-9 pr-4 rounded-md bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber font-sans"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onFilterChange("all")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeFilter === "all"
                  ? "bg-text-primary text-canvas font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              All Releases
            </button>
            <button
              onClick={() => onFilterChange("rated")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeFilter === "rated"
                  ? "bg-amber text-canvas font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Star className="w-3 h-3" />
              <span>Rated</span>
            </button>
            <button
              onClick={() => onFilterChange("unrated")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeFilter === "unrated"
                  ? "bg-text-primary text-canvas font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              Unrated
            </button>
            <button
              onClick={() => onFilterChange("favorites")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeFilter === "favorites"
                  ? "bg-crimson text-white font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>Favorites</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-text-muted text-right hidden sm:block">
            Crate Shelf View
          </div>
        </div>
      </div>
    </header>
  );
}
