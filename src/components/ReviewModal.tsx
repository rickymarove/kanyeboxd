"use client";

import React, { useState } from "react";
import { AlbumWithReview, Review } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { X, Heart, Calendar, Music2, Trash2, Check, Loader2 } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!confirm("Are you sure you want to remove this rating and review?")) return;

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
    <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5">
      {errorMsg && (
        <div className="p-3 rounded-md bg-crimson/10 border border-crimson/30 text-crimson text-xs">
          {errorMsg}
        </div>
      )}

      {/* Rating & Favorite Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-raised/60 border border-border/80">
        <div>
          <label className="block text-xs font-mono font-medium text-text-secondary mb-1.5">
            Rating (5-Star Scale)
          </label>
          <RatingStars
            value={rating}
            onChange={setRating}
            size="lg"
            showValue
          />
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isFavorite
                ? "bg-crimson/15 border-crimson text-crimson"
                : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? "fill-crimson" : ""}`}
            />
            <span>Favorite</span>
          </button>
        </div>
      </div>

      {/* Date Listened */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-mono font-medium text-text-secondary mb-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber" />
          <span>Date Listened</span>
        </label>
        <input
          type="date"
          value={listenedOn}
          onChange={(e) => setListenedOn(e.target.value)}
          className="w-full h-10 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary focus:outline-none focus:border-amber transition-colors font-mono"
        />
      </div>

      {/* Standout Favorite Tracks */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-mono font-medium text-text-secondary mb-1.5">
          <Music2 className="w-3.5 h-3.5 text-amber" />
          <span>Standout Tracks (comma-separated)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Runaway, Devil in a New Dress, Gorgeous"
          value={favoriteTracks}
          onChange={(e) => setFavoriteTracks(e.target.value)}
          className="w-full h-10 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors"
        />
      </div>

      {/* Journal Review Text */}
      <div>
        <label className="block text-xs font-mono font-medium text-text-secondary mb-1.5">
          Listening Notes / Review
        </label>
        <textarea
          rows={4}
          placeholder="Write your impressions, favorite moments, lyrical standouts, or memories associated with this spin..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="w-full p-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-border">
        {existingReview ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-crimson hover:bg-crimson/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Log</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-amber hover:bg-amber/90 text-canvas text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Save Log</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-raised/40">
          <div className="flex items-center gap-3">
            {album.cover_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-12 h-12 rounded object-cover border border-border shrink-0"
              />
            )}
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-text-primary line-clamp-1">
                {album.title}
              </h2>
              <p className="text-xs text-text-secondary line-clamp-1 font-mono">
                {album.artist} {album.release_year ? `· ${album.release_year}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Keyed to Album ID to reset state cleanly */}
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
