"use client";

import React, { useState } from "react";
import { Album } from "@/lib/types";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseTracklistText } from "@/lib/trackParser";

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
  const [tracklistRaw, setTracklistRaw] = useState("");
  const [showTracklistInput, setShowTracklistInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTracklistChange = (text: string) => {
    setTracklistRaw(text);
    const parsed = parseTracklistText(text);
    if (parsed.length > 0) {
      setTrackCount(parsed.length.toString());
    }
  };

  const handleClose = () => {
    setTitle("");
    setArtist("");
    setCoverUrl("");
    setGenres("");
    setTracklistRaw("");
    setShowTracklistInput(false);
    setErrorMsg(null);
    onClose();
  };

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

    const parsedTracks = parseTracklistText(tracklistRaw);
    const effectiveTrackCount =
      parsedTracks.length > 0
        ? parsedTracks.length
        : trackCount
        ? parseInt(trackCount, 10)
        : 0;

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
          track_count: effectiveTrackCount,
        })
        .select()
        .single();

      if (error) throw error;

      // If tracks were provided, insert them linked to the new album
      if (parsedTracks.length > 0 && data?.id) {
        const trackRows = parsedTracks.map((t) => ({
          album_id: data.id,
          track_number: t.track_number,
          title: t.title,
          duration_seconds: t.duration_seconds,
        }));

        const { error: tracksErr } = await supabase
          .from("tracks")
          .insert(trackRows);

        if (tracksErr) {
          console.error("Warning: album created but tracks failed to insert:", tracksErr);
        }
      }

      onAdded(data as Album);
      handleClose();
    } catch (err: unknown) {
      console.error("Failed to add album:", err);
      const msg = err instanceof Error ? err.message : "Failed to add album";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-lg bg-surface border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <h2 className="text-xs font-semibold text-text-primary">
            Add Release
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded bg-crimson/10 border border-crimson/30 text-crimson text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. In Rainbows"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Artist *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Radiohead"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Year
              </label>
              <input
                type="number"
                placeholder="2007"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Tracks
              </label>
              <input
                type="number"
                placeholder="10"
                value={trackCount}
                onChange={(e) => setTrackCount(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Artwork URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Genres (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Alternative, Art Rock"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
            />
          </div>

          {/* Tracklist bulk input toggle */}
          <div className="pt-1 border-t border-border/40">
            <div className="flex items-center justify-between mb-1.5">
              <button
                type="button"
                onClick={() => setShowTracklistInput((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <span>{showTracklistInput ? "Hide tracklist input" : "+ Paste tracklist (optional)"}</span>
              </button>
              {parseTracklistText(tracklistRaw).length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/60 text-[10px] text-text-secondary">
                  {parseTracklistText(tracklistRaw).length} tracks detected
                </span>
              )}
            </div>

            {showTracklistInput && (
              <div className="space-y-1.5 mt-2">
                <textarea
                  rows={4}
                  placeholder={"1. Dark Fantasy 4:40\n2. Gorgeous 5:57\n3. POWER"}
                  value={tracklistRaw}
                  onChange={(e) => handleTracklistChange(e.target.value)}
                  className="w-full p-2.5 rounded bg-canvas/70 border border-border text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-border-subtle"
                />
                <p className="text-[11px] text-text-muted">
                  Paste tracklist lines. Auto-syncs track count and adds tracks to release.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-text-primary hover:bg-white text-canvas text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
