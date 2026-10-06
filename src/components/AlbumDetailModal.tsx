"use client";

import React, { useEffect, useState } from "react";
import { AlbumWithReview, Track } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { X, Heart, Calendar, Disc, Clock, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AlbumDetailModalProps {
  album: AlbumWithReview | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRate: (album: AlbumWithReview) => void;
}

export function AlbumDetailModal({
  album,
  isOpen,
  onClose,
  onOpenRate,
}: AlbumDetailModalProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  useEffect(() => {
    if (!album) return;

    // Fetch tracks for this album from Supabase
    async function loadTracks() {
      setIsLoadingTracks(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", album!.id)
        .order("track_number", { ascending: true });

      if (!error && data) {
        setTracks(data as Track[]);
      }
      setIsLoadingTracks(false);
    }

    loadTracks();
  }, [album]);

  if (!isOpen || !album) return null;

  const review = album.review;
  const isRated = review && review.rating !== null && review.rating > 0;
  const isFavorite = review?.is_favorite ?? false;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-raised/40">
          <span className="text-xs font-mono text-text-muted tracking-wider uppercase">
            Liner Notes & Archive Record
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Hero Section: Cover & Primary Details */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-36 sm:w-44 aspect-square shrink-0 rounded-lg overflow-hidden border border-border bg-surface-raised shadow-lg">
              {album.cover_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <Disc className="w-12 h-12 stroke-1" />
                </div>
              )}
              {isFavorite && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 flex items-center justify-center text-crimson">
                  <Heart className="w-3.5 h-3.5 fill-crimson" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between self-stretch">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
                  {album.title}
                </h1>
                <p className="text-sm sm:text-base text-text-secondary mt-1 font-medium">
                  {album.artist}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {album.release_year && (
                    <span className="px-2 py-0.5 rounded bg-surface-raised border border-border text-xs font-mono text-text-secondary">
                      {album.release_year}
                    </span>
                  )}
                  {album.track_count > 0 && (
                    <span className="px-2 py-0.5 rounded bg-surface-raised border border-border text-xs font-mono text-text-secondary">
                      {album.track_count} tracks
                    </span>
                  )}
                </div>

                {album.genres && album.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {album.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-full bg-border-subtle text-[11px] font-mono text-text-muted"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenRate(album);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber hover:bg-amber/90 text-canvas text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isRated ? "Edit Rating & Review" : "Rate This Album"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Review / Diary Entry */}
          <div className="p-4 rounded-lg bg-surface-raised/50 border border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-mono font-medium text-text-secondary">
                Personal Log
              </span>
              {review?.listened_on && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{review.listened_on}</span>
                </div>
              )}
            </div>

            <div className="pt-3">
              {isRated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RatingStars
                      value={review.rating}
                      readOnly
                      size="md"
                      showValue
                    />
                    {isFavorite && (
                      <span className="inline-flex items-center gap-1 text-xs text-crimson font-medium ml-2">
                        <Heart className="w-3.5 h-3.5 fill-crimson" />
                        <span>Favorite</span>
                      </span>
                    )}
                  </div>

                  {review.favorite_tracks && review.favorite_tracks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-text-muted font-mono mr-1">
                        Standout Tracks:
                      </span>
                      {review.favorite_tracks.map((track) => (
                        <span
                          key={track}
                          className="px-2 py-0.5 rounded bg-surface border border-border text-xs text-amber font-mono"
                        >
                          {track}
                        </span>
                      ))}
                    </div>
                  )}

                  {review.review_text && (
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed pt-1 whitespace-pre-wrap font-sans">
                      {review.review_text}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-text-muted">
                  You have not logged or rated this album yet.
                </div>
              )}
            </div>
          </div>

          {/* Tracklist Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
              Tracklist
            </h3>

            {isLoadingTracks ? (
              <div className="py-4 text-center text-xs text-text-muted font-mono">
                Loading tracks...
              </div>
            ) : tracks.length > 0 ? (
              <div className="divide-y divide-border/40 rounded-lg border border-border bg-surface overflow-hidden">
                {tracks.map((t) => {
                  const isStandout = review?.favorite_tracks?.some(
                    (fav) => fav.toLowerCase().trim() === t.title.toLowerCase().trim()
                  );

                  return (
                    <div
                      key={t.id}
                      className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-surface-raised/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-mono text-text-muted">
                          {t.track_number}
                        </span>
                        <span
                          className={`font-medium ${
                            isStandout ? "text-amber" : "text-text-primary"
                          }`}
                        >
                          {t.title}
                        </span>
                        {isStandout && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber/15 text-amber font-mono">
                            Pick
                          </span>
                        )}
                      </div>

                      {t.duration_seconds && (
                        <span className="font-mono text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-muted/60" />
                          <span>{formatDuration(t.duration_seconds)}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-surface border border-border text-center text-xs text-text-muted font-mono">
                Tracklist metadata not yet cataloged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
