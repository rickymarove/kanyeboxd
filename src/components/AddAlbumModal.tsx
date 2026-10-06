"use client";

import React, { useState } from "react";
import { Album } from "@/lib/types";
import { X, Plus, Disc, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (newAlbum: Album) => void;
}

export function AddAlbumModal({ isOpen, onClose, onAdded }: AddAlbumModalProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [releaseYear, setReleaseYear] = useState<string>(new Date().getFullYear().toString());
  const [coverUrl, setCoverUrl] = useState("");
  const [genres, setGenres] = useState("");
  const [trackCount, setTrackCount] = useState<string>("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setErrorMsg("Title and Artist are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const genreList = genres
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("albums")
        .insert({
          title: title.trim(),
          artist: artist.trim(),
          release_year: releaseYear ? parseInt(releaseYear, 10) : null,
          cover_url: coverUrl.trim() || null,
          genres: genreList,
          track_count: trackCount ? parseInt(trackCount, 10) : 0,
        })
        .select()
        .single();

      if (error) throw error;

      onAdded(data as Album);
      onClose();
      // Reset form
      setTitle("");
      setArtist("");
      setCoverUrl("");
      setGenres("");
    } catch (err: unknown) {
      console.error("Failed to add album:", err);
      const msg = err instanceof Error ? err.message : "Failed to add album";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-amber" />
            <h2 className="font-semibold text-sm text-text-primary">
              Add Release to Crate
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-md bg-crimson/10 border border-crimson/30 text-crimson text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Album Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. In Rainbows"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Artist *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Radiohead"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1">
                Release Year
              </label>
              <input
                type="number"
                placeholder="2007"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1">
                Track Count
              </label>
              <input
                type="number"
                placeholder="10"
                value={trackCount}
                onChange={(e) => setTrackCount(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Cover Artwork URL
            </label>
            <input
              type="url"
              placeholder="https://... (image link)"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Genres (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Art Rock, Alternative, Electronic"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber hover:bg-amber/90 text-canvas text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Add to Crate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
