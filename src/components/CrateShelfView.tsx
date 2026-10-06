"use client";

import React, { useState, useMemo } from "react";
import { Album, AlbumWithReview, Review, UserStats } from "@/lib/types";
import { Navbar } from "./Navbar";
import { AlbumCard } from "./AlbumCard";
import { ReviewModal } from "./ReviewModal";
import { AlbumDetailModal } from "./AlbumDetailModal";
import { AddAlbumModal } from "./AddAlbumModal";
import { Disc } from "lucide-react";

interface CrateShelfViewProps {
  initialAlbums: Album[];
  initialReviews: Review[];
  defaultUserId?: string;
}

export function CrateShelfView({
  initialAlbums,
  initialReviews,
  defaultUserId = "00000000-0000-0000-0000-000000000001",
}: CrateShelfViewProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const [activeFilter, setActiveFilter] = useState<"all" | "rated" | "unrated" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [selectedAlbumForRate, setSelectedAlbumForRate] = useState<AlbumWithReview | null>(null);
  const [selectedAlbumForDetail, setSelectedAlbumForDetail] = useState<AlbumWithReview | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Map reviews by album_id for fast lookup
  const reviewsByAlbumId = useMemo(() => {
    const map = new Map<string, Review>();
    reviews.forEach((r) => {
      map.set(r.album_id, r);
    });
    return map;
  }, [reviews]);

  // Combined albums with their current reviews
  const albumsWithReviews: AlbumWithReview[] = useMemo(() => {
    return albums.map((album) => ({
      ...album,
      review: reviewsByAlbumId.get(album.id) || null,
    }));
  }, [albums, reviewsByAlbumId]);

  // Compute stats
  const stats: UserStats = useMemo(() => {
    const ratedReviews = reviews.filter((r) => r.rating !== null && r.rating > 0);
    const totalRated = ratedReviews.length;
    const favoriteCount = reviews.filter((r) => r.is_favorite).length;
    const sumRatings = ratedReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const averageRating = totalRated > 0 ? sumRatings / totalRated : 0;

    return {
      totalRated,
      averageRating,
      favoriteCount,
      recentListens: totalRated,
    };
  }, [reviews]);

  // Filtered list
  const filteredAlbums = useMemo(() => {
    return albumsWithReviews.filter((album) => {
      // 1. Text Search Match
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesTitle = album.title.toLowerCase().includes(q);
        const matchesArtist = album.artist.toLowerCase().includes(q);
        const matchesGenre = album.genres?.some((g) => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesArtist && !matchesGenre) {
          return false;
        }
      }

      // 2. Tab Filter Match
      const isRated = album.review && album.review.rating !== null && album.review.rating > 0;
      const isFavorite = album.review?.is_favorite ?? false;

      if (activeFilter === "rated" && !isRated) return false;
      if (activeFilter === "unrated" && isRated) return false;
      if (activeFilter === "favorites" && !isFavorite) return false;

      return true;
    });
  }, [albumsWithReviews, searchQuery, activeFilter]);

  const handleReviewSaved = (savedReview: Review | null) => {
    if (!savedReview) {
      if (selectedAlbumForRate) {
        setReviews((prev) => prev.filter((r) => r.album_id !== selectedAlbumForRate.id));
      }
      return;
    }

    setReviews((prev) => {
      const existsIndex = prev.findIndex((r) => r.album_id === savedReview.album_id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = savedReview;
        return next;
      }
      return [savedReview, ...prev];
    });
  };

  const handleAlbumAdded = (newAlbum: Album) => {
    setAlbums((prev) => [newAlbum, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-primary">
      {/* Minimalist Top Navbar */}
      <Navbar
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Section Headline */}
        <div className="flex items-baseline justify-between pb-4 mb-6 border-b border-border/50">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm font-semibold tracking-tight text-text-primary">
              {activeFilter === "all" && "Catalog"}
              {activeFilter === "rated" && "Rated"}
              {activeFilter === "unrated" && "Unrated"}
              {activeFilter === "favorites" && "Favorites"}
            </h1>
            <span className="text-xs text-text-muted">
              {filteredAlbums.length} {filteredAlbums.length === 1 ? "release" : "releases"}
            </span>
          </div>

          {searchQuery && (
            <span className="text-xs text-text-muted">
              Matching &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {/* Albums Grid */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-7">
            {filteredAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onRate={(item) => setSelectedAlbumForRate(item)}
                onViewDetails={(item) => setSelectedAlbumForDetail(item)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Disc className="w-8 h-8 text-text-muted/40 stroke-1 mb-3" />
            <h3 className="text-xs font-medium text-text-secondary mb-1">
              No releases found
            </h3>
            <p className="text-xs text-text-muted max-w-xs mb-4">
              {searchQuery
                ? `No results for "${searchQuery}".`
                : activeFilter === "rated"
                ? "You haven't logged any reviews yet."
                : activeFilter === "favorites"
                ? "No favorites marked yet."
                : "No albums available."}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs text-text-secondary hover:text-text-primary underline cursor-pointer"
              >
                Show all releases
              </button>
            )}
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-border/40 py-6 text-center">
        <p className="text-[11px] text-text-muted/70 tracking-tight">
          kanyeboxd
        </p>
      </footer>

      {/* Modals */}
      <ReviewModal
        album={selectedAlbumForRate}
        isOpen={!!selectedAlbumForRate}
        onClose={() => setSelectedAlbumForRate(null)}
        onSaved={handleReviewSaved}
        userId={defaultUserId}
      />

      <AlbumDetailModal
        album={selectedAlbumForDetail}
        isOpen={!!selectedAlbumForDetail}
        onClose={() => setSelectedAlbumForDetail(null)}
        onOpenRate={(item) => setSelectedAlbumForRate(item)}
      />

      <AddAlbumModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={handleAlbumAdded}
      />
    </div>
  );
}
