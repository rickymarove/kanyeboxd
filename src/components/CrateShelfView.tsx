"use client";

import React, { useState, useMemo } from "react";
import { Album, AlbumWithReview, Review, UserStats } from "@/lib/types";
import { Navbar } from "./Navbar";
import { AlbumCard } from "./AlbumCard";
import { ReviewModal } from "./ReviewModal";
import { AlbumDetailModal } from "./AlbumDetailModal";
import { AddAlbumModal } from "./AddAlbumModal";
import { Disc3 } from "lucide-react";

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

  // Map reviews by album_id for fast composite lookup
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

  // Review callback
  const handleReviewSaved = (savedReview: Review | null) => {
    if (!savedReview) {
      // Review was deleted
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
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Sticky Top Navbar */}
      <Navbar
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Vinyl Shelf Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shelf Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-border/80 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {activeFilter === "all" && "Record Crate"}
              {activeFilter === "rated" && "Rated Catalog"}
              {activeFilter === "unrated" && "Unrated Records"}
              {activeFilter === "favorites" && "Favorite Spins"}
            </h1>
            <p className="text-xs font-mono text-text-secondary mt-1">
              Showing {filteredAlbums.length} of {albums.length} releases in archive
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <span>Sorted by Crate Order</span>
          </div>
        </div>

        {/* Albums Grid */}
        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
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
          <div className="py-24 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-surface/40 p-8">
            <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-muted mb-4">
              <Disc3 className="w-6 h-6 stroke-1 opacity-70" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              No releases found
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mb-5">
              {searchQuery
                ? `No albums matched "${searchQuery}". Try searching by another artist or genre.`
                : activeFilter === "rated"
                ? "You haven't logged any ratings yet. Pick an album and rate it to start your journal."
                : activeFilter === "favorites"
                ? "You haven't marked any favorite albums yet."
                : "No albums available in this view."}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-md bg-surface-raised hover:bg-surface border border-border text-xs font-medium text-text-primary transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-6 bg-canvas text-center">
        <p className="text-xs font-mono text-text-muted">
          Kanyeboxd · Private Music Journal & Listening Vault
        </p>
      </footer>

      {/* Review Modal */}
      <ReviewModal
        album={selectedAlbumForRate}
        isOpen={!!selectedAlbumForRate}
        onClose={() => setSelectedAlbumForRate(null)}
        onSaved={handleReviewSaved}
        userId={defaultUserId}
      />

      {/* Liner Notes Detail Modal */}
      <AlbumDetailModal
        album={selectedAlbumForDetail}
        isOpen={!!selectedAlbumForDetail}
        onClose={() => setSelectedAlbumForDetail(null)}
        onOpenRate={(item) => setSelectedAlbumForRate(item)}
      />

      {/* Add Release Modal */}
      <AddAlbumModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={handleAlbumAdded}
      />
    </div>
  );
}
