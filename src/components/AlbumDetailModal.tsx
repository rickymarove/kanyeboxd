"use client";

import React, { useEffect, useState } from "react";
import { AlbumWithReview, Track } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { X, Heart, Calendar, Disc, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AlbumDetailModalProps {
  album: AlbumWithReview | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRate: (album: AlbumWithReview) => void;
  isAuthenticated?: boolean;
}

export function AlbumDetailModal({
  album,
  isOpen,
  onClose,
  onOpenRate,
  isAuthenticated = false,
}: AlbumDetailModalProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  useEffect(() => {
    if (!album) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-lg bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <span className="text-xs text-text-muted">
            Release Details
          </span>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Hero Section: Cover & Primary Details */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-32 sm:w-36 aspect-square shrink-0 rounded-md overflow-hidden border border-border/60 bg-canvas">
              {album.cover_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <Disc className="w-8 h-8 stroke-1 opacity-50" />
                </div>
              )}
              {isFavorite && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-crimson">
                  <Heart className="w-3 h-3 fill-crimson" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between self-stretch">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-text-primary leading-tight">
                  {album.title}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  {album.artist}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-text-muted">
                  {album.release_year && <span>{album.release_year}</span>}
                  {album.track_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{album.track_count} tracks</span>
                    </>
                  )}
                </div>

                {album.genres && album.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {album.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded text-[11px] bg-surface-raised text-text-muted"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button: only shown if authenticated owner */}
              {isAuthenticated && (
                <div className="pt-3 mt-3 border-t border-border/50">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRate(album);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:border-border/80 bg-surface hover:bg-surface-raised text-xs font-medium text-text-primary transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-text-muted" />
                    <span>{isRated ? "Edit log" : "Log this release"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Review / Diary Entry */}
          <div className="p-4 rounded-md bg-canvas/40 border border-border/60">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/40 text-xs">
              <span className="font-medium text-text-secondary">
                Curator Log
              </span>
              {review?.listened_on && (
                <div className="flex items-center gap-1 text-text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{review.listened_on}</span>
                </div>
              )}
            </div>

            <div className="pt-2.5">
              {isRated ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <RatingStars
                      value={review.rating}
                      readOnly
                      size="sm"
                      showValue
                    />
                    {isFavorite && (
                      <span className="inline-flex items-center gap-1 text-xs text-crimson ml-1">
                        <Heart className="w-3 h-3 fill-crimson" />
                        <span>Favorite</span>
                      </span>
                    )}
                  </div>

                  {review.favorite_tracks && review.favorite_tracks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5 text-xs">
                      <span className="text-text-muted">Standouts:</span>
                      {review.favorite_tracks.map((track) => (
                        <span
                          key={track}
                          className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px] text-text-secondary"
                        >
                          {track}
                        </span>
                      ))}
                    </div>
                  )}

                  {review.review_text && (
                    <p className="text-xs text-text-secondary leading-relaxed pt-1 whitespace-pre-wrap">
                      {review.review_text}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  Not rated yet.
                </p>
              )}
            </div>
          </div>

          {/* Tracklist Section */}
          <div>
            <h3 className="text-xs font-medium text-text-secondary mb-2.5">
              Tracklist
            </h3>

            {isLoadingTracks ? (
              <div className="py-3 text-center text-xs text-text-muted">
                Loading tracks...
              </div>
            ) : tracks.length > 0 ? (
              <div className="divide-y divide-border/30 rounded border border-border/60 bg-surface overflow-hidden">
                {tracks.map((t) => {
                  const isStandout = review?.favorite_tracks?.some(
                    (fav) => fav.toLowerCase().trim() === t.title.toLowerCase().trim()
                  );

                  return (
                    <div
                      key={t.id}
                      className="px-3 py-2 flex items-center justify-between text-xs hover:bg-surface-raised/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 text-center text-text-muted text-[11px]">
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
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber/10 text-amber">
                            Pick
                          </span>
                        )}
                      </div>

                      {t.duration_seconds && (
                        <span className="text-text-muted text-[11px]">
                          {formatDuration(t.duration_seconds)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded border border-border/40 text-center text-xs text-text-muted">
                No tracks listed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
