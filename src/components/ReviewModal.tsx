"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlbumWithReview, Review, Track } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { DateSelector } from "./DateSelector";
import { X, Heart, Loader2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ReviewModalProps {
  album: AlbumWithReview | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedReview: Review | null) => void;
  userId?: string;
}

interface ReviewFormContentProps {
  album: AlbumWithReview;
  onClose: () => void;
  onSaved: (updatedReview: Review | null) => void;
  userId: string;
}

function ReviewFormContent({
  album,
  onClose,
  onSaved,
  userId,
}: ReviewFormContentProps) {
  const existingReview = album.review;

  const [rating, setRating] = useState<number>(existingReview?.rating ?? 0);
  const [isFavorite, setIsFavorite] = useState<boolean>(
    existingReview?.is_favorite ?? false
  );
  const [listenedOn, setListenedOn] = useState<string>(
    existingReview?.listened_on || new Date().toISOString().split("T")[0]
  );
  const [favoriteTracks, setFavoriteTracks] = useState<string>(
    existingReview?.favorite_tracks?.length
      ? existingReview.favorite_tracks.join(", ")
      : ""
  );
  const [reviewText, setReviewText] = useState<string>(
    existingReview?.review_text || ""
  );
  const [loadedTracks, setLoadedTracks] = useState<Track[]>([]);
  const tracks =
    album.tracks && album.tracks.length > 0 ? album.tracks : loadedTracks;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (album.tracks && album.tracks.length > 0) return;

    let isMounted = true;
    async function loadTracks() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", album.id)
        .order("track_number", { ascending: true });

      if (isMounted && !error && data) {
        setLoadedTracks(data as Track[]);
      }
    }

    loadTracks();

    return () => {
      isMounted = false;
    };
  }, [album.id, album.tracks]);

  const parsedFavorites = useMemo(() => {
    return favoriteTracks
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [favoriteTracks]);

  const handleToggleTrack = (trackTitle: string) => {
    const isSelected = parsedFavorites.some(
      (t) => t.toLowerCase().trim() === trackTitle.toLowerCase().trim()
    );

    let updated: string[];
    if (isSelected) {
      updated = parsedFavorites.filter(
        (t) => t.toLowerCase().trim() !== trackTitle.toLowerCase().trim()
      );
    } else {
      updated = [...parsedFavorites, trackTitle];
    }

    setFavoriteTracks(updated.join(", "));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const supabase = createClient();
    const tracksArray = favoriteTracks
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const reviewPayload = {
      user_id: userId,
      album_id: album.id,
      rating: rating > 0 ? rating : null,
      is_favorite: isFavorite,
      listened_on: listenedOn,
      favorite_tracks: tracksArray,
      review_text: reviewText.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("reviews")
        .upsert(reviewPayload, { onConflict: "user_id,album_id" })
        .select()
        .single();

      if (error) throw error;

      onSaved(data as Review);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save review:", err);
      const msg = err instanceof Error ? err.message : "Failed to save review";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview?.id) return;
    if (!confirm("Remove this rating and review?")) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", existingReview.id);

      if (error) throw error;

      onSaved(null);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to delete review:", err);
      const msg = err instanceof Error ? err.message : "Failed to delete review";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5">
      {errorMsg && (
        <div className="p-2.5 rounded bg-crimson/10 border border-crimson/30 text-crimson text-xs">
          {errorMsg}
        </div>
      )}

      {/* Rating & Favorite Section */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Score
          </label>
          <RatingStars
            value={rating}
            onChange={setRating}
            size="lg"
            showValue
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            isFavorite
              ? "bg-crimson/10 border-crimson/40 text-crimson"
              : "border-border text-text-muted hover:text-text-primary"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-crimson" : ""}`} />
          <span>Favorite</span>
        </button>
      </div>

      {/* Date Listened using Custom DateSelector */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Date Listened
        </label>
        <DateSelector
          value={listenedOn}
          onChange={setListenedOn}
        />
      </div>

      {/* Standout Tracks */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-text-secondary">
            Standout Tracks
          </label>
          {tracks.length > 0 && (
            <span className="text-[11px] text-text-muted">
              Click tracks to toggle
            </span>
          )}
        </div>

        {tracks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-canvas/50 border border-border/50 max-h-36 overflow-y-auto">
            {tracks.map((t) => {
              const isSelected = parsedFavorites.some(
                (fav) => fav.toLowerCase().trim() === t.title.toLowerCase().trim()
              );

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToggleTrack(t.title)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-amber/15 border border-amber/40 text-amber font-medium"
                      : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle"
                  }`}
                >
                  <Star
                    className={`w-3 h-3 shrink-0 ${
                      isSelected ? "fill-amber text-amber" : "text-text-muted/40"
                    }`}
                  />
                  <span>
                    <span className="text-text-muted text-[11px] mr-1">
                      {t.track_number}.
                    </span>
                    {t.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <input
          type="text"
          placeholder={
            tracks.length > 0
              ? "Or edit comma-separated names..."
              : "e.g. Runaway, Devil in a New Dress"
          }
          value={favoriteTracks}
          onChange={(e) => setFavoriteTracks(e.target.value)}
          className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
        />
      </div>

      {/* Journal Review Text */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Notes & Thoughts
        </label>
        <textarea
          rows={3}
          placeholder="Personal notes, favorite moments, thoughts on production..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="w-full p-3 rounded-md bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle resize-none leading-relaxed"
        />
      </div>

      {/* Modal Actions */}
      <div className="pt-3 flex items-center justify-between border-t border-border/50">
        {existingReview ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="text-xs text-crimson/80 hover:text-crimson transition-colors cursor-pointer"
          >
            Remove log
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-text-primary hover:bg-white text-canvas text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>Save</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export function ReviewModal({
  album,
  isOpen,
  onClose,
  onSaved,
  userId = "00000000-0000-0000-0000-000000000001",
}: ReviewModalProps) {
  if (!isOpen || !album) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-lg bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Minimal Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            {album.cover_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-10 h-10 rounded object-cover border border-border/60 shrink-0"
              />
            )}
            <div>
              <h2 className="text-xs font-semibold text-text-primary line-clamp-1">
                {album.title}
              </h2>
              <p className="text-[11px] text-text-muted line-clamp-1">
                {album.artist} {album.release_year ? `· ${album.release_year}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <ReviewFormContent
          key={album.id}
          album={album}
          onClose={onClose}
          onSaved={onSaved}
          userId={userId}
        />
      </div>
    </div>
  );
}
