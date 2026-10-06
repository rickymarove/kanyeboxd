"use client";

import React from "react";
import { Search, Plus } from "lucide-react";
import { UserStats } from "@/lib/types";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  stats: UserStats;
  activeFilter: "all" | "rated" | "unrated" | "favorites";
  onFilterChange: (filter: "all" | "rated" | "unrated" | "favorites") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal?: () => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export function Navbar({
  stats,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  user,
  onOpenAuthModal,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-canvas/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main top bar */}
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Minimalist Wordmark & Navigation */}
          <div className="flex items-center gap-6 shrink-0">
            <span className="text-sm font-semibold tracking-tight text-text-primary select-none">
              kanyeboxd
            </span>

            {/* Desktop Filter Navigation */}
            <nav className="hidden sm:flex items-center gap-1 text-xs">
              <button
                onClick={() => onFilterChange("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeFilter === "all"
                    ? "text-text-primary font-medium bg-surface-raised"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                All
              </button>
              <button
                onClick={() => onFilterChange("rated")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeFilter === "rated"
                    ? "text-text-primary font-medium bg-surface-raised"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Rated
              </button>
              <button
                onClick={() => onFilterChange("unrated")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeFilter === "unrated"
                    ? "text-text-primary font-medium bg-surface-raised"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Unrated
              </button>
              <button
                onClick={() => onFilterChange("favorites")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeFilter === "favorites"
                    ? "text-text-primary font-medium bg-surface-raised"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Favorites
              </button>
            </nav>
          </div>

          {/* Minimalist Search Bar */}
          <div className="flex-1 max-w-sm relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-8 pl-8.5 pr-3 rounded-md bg-surface border border-border/80 text-xs text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:border-border-subtle focus:bg-surface-raised/40 transition-all"
            />
          </div>

          {/* Right Section: Metrics & Auth Controls */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Minimal metrics */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted">
              <span>
                <span className="text-text-secondary font-medium">{stats.totalRated}</span> rated
              </span>
              <span>·</span>
              <span>
                <span className="text-text-secondary font-medium">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                </span> avg
              </span>
              <span>·</span>
              <span>
                <span className="text-text-secondary font-medium">{stats.favoriteCount}</span> fav
              </span>
            </div>

            {/* Authenticated Owner Actions vs Read-Only Visitor */}
            {user ? (
              <div className="flex items-center gap-2">
                {onOpenAddModal && (
                  <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border hover:border-border/80 bg-surface hover:bg-surface-raised text-xs font-medium text-text-primary transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-text-muted" />
                    <span>Add</span>
                  </button>
                )}
                <button
                  onClick={onSignOut}
                  className="text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded transition-colors cursor-pointer"
                  title={`Signed in as ${user.email}`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-2.5 py-1.5 rounded-md border border-border/80 hover:border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Mobile controls bar */}
        <div className="sm:hidden py-2 flex flex-col gap-2 border-t border-border/40">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-7 pl-8 pr-3 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {(["all", "rated", "unrated", "favorites"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => onFilterChange(filter)}
                  className={`px-2.5 py-1 rounded capitalize shrink-0 ${
                    activeFilter === filter
                      ? "bg-surface-raised text-text-primary font-medium"
                      : "text-text-muted"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {user ? (
              <button
                onClick={onSignOut}
                className="text-[11px] text-text-muted hover:text-text-primary shrink-0"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="text-[11px] text-text-secondary hover:text-text-primary shrink-0 underline"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
