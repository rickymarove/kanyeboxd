"use client";

import React, { useState, useEffect } from "react";
import { Album, Track } from "@/lib/types";
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  FileText,
  List,
  Disc,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  parseTracklistText,
  formatSeconds,
  parseDurationToSeconds,
} from "@/lib/trackParser";

interface TrackRow {
  id: string; // local client id
  track_number: number;
  title: string;
  duration_text: string;
}

interface TracklistEditorModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
  onTracksSaved: (newTracks: Track[], trackCount: number) => void;
}

export function TracklistEditorModal({
  album,
  isOpen,
  onClose,
  onTracksSaved,
}: TracklistEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "paste">("visual");
  const [rows, setRows] = useState<TrackRow[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing tracks when modal opens
  useEffect(() => {
    if (!isOpen || !album) return;

    let isMounted = true;
    async function fetchTracks() {
      setIsLoading(true);
      setErrorMsg(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", album!.id)
        .order("track_number", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setErrorMsg("Failed to load existing tracks.");
      } else if (data && data.length > 0) {
        setRows(
          data.map((t: Track) => ({
            id: t.id || Math.random().toString(),
            track_number: t.track_number,
            title: t.title,
            duration_text: formatSeconds(t.duration_seconds),
          }))
        );
      } else {
        // If empty, start with a few clean empty rows or empty list
        setRows([]);
      }
      setIsLoading(false);
    }

    fetchTracks();

    return () => {
      isMounted = false;
    };
  }, [isOpen, album]);

  if (!isOpen || !album) return null;

  // Add single empty row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        track_number: prev.length + 1,
        title: "",
        duration_text: "",
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, i) => ({ ...r, track_number: i + 1 }));
    });
  };

  // Move row up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setRows((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((r, i) => ({ ...r, track_number: i + 1 }));
    });
  };

  // Move row down
  const handleMoveDown = (index: number) => {
    if (index === rows.length - 1) return;
    setRows((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((r, i) => ({ ...r, track_number: i + 1 }));
    });
  };

  // Update row field
  const handleRowChange = (
    index: number,
    field: "title" | "duration_text",
    value: string
  ) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Parse bulk pasted text
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseTracklistText(pasteText);
    const newRows: TrackRow[] = parsed.map((p) => ({
      id: Math.random().toString(),
      track_number: p.track_number,
      title: p.title,
      duration_text: formatSeconds(p.duration_seconds),
    }));
    setRows(newRows);
    setActiveTab("visual");
    setPasteText("");
  };

  // Calculate total duration in seconds
  const totalSeconds = rows.reduce((acc, row) => {
    const s = parseDurationToSeconds(row.duration_text);
    return acc + (s || 0);
  }, 0);

  // Save to Supabase
  const handleSave = async () => {
    // Filter non-empty tracks
    const validRows = rows.filter((r) => r.title.trim().length > 0);

    setIsSaving(true);
    setErrorMsg(null);
    const supabase = createClient();

    try {
      // 1. Delete all existing tracks for this album
      const { error: deleteError } = await supabase
        .from("tracks")
        .delete()
        .eq("album_id", album.id);

      if (deleteError) throw deleteError;

      // 2. Insert new tracks if any
      let insertedTracks: Track[] = [];
      if (validRows.length > 0) {
        const payload = validRows.map((r, idx) => ({
          album_id: album.id,
          track_number: idx + 1,
          title: r.title.trim(),
          duration_seconds: parseDurationToSeconds(r.duration_text),
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from("tracks")
          .insert(payload)
          .select()
          .order("track_number", { ascending: true });

        if (insertError) throw insertError;
        insertedTracks = insertedData as Track[];
      }

      // 3. Update album track count
      const newTrackCount = validRows.length;
      const { error: updateError } = await supabase
        .from("albums")
        .update({ track_count: newTrackCount })
        .eq("id", album.id);

      if (updateError) throw updateError;

      // Notify parent
      onTracksSaved(insertedTracks, newTrackCount);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save tracklist:", err);
      const msg = err instanceof Error ? err.message : "Failed to save tracklist.";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-lg bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-canvas border border-border/60 overflow-hidden shrink-0 flex items-center justify-center">
              {album.cover_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc className="w-4 h-4 text-text-muted" />
              )}
            </div>
            <div>
              <h2 className="text-xs font-semibold text-text-primary leading-tight">
                Edit Tracklist
              </h2>
              <p className="text-[11px] text-text-muted truncate max-w-[280px]">
                {album.title} &middot; {album.artist}
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-border/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`inline-flex items-center gap-1.5 pb-2 px-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "visual"
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Interactive rows ({rows.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`inline-flex items-center gap-1.5 pb-2 px-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "paste"
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste tracklist</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded bg-crimson/10 border border-crimson/30 text-crimson text-xs">
            {errorMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-xs text-text-muted gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading tracks...</span>
            </div>
          ) : activeTab === "visual" ? (
            <div className="space-y-3">
              {rows.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border/60 rounded-md">
                  <p className="text-xs text-text-muted mb-3">
                    No tracks in this tracklist yet.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-raised border border-border text-xs text-text-primary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add track</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("paste")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Paste tracklist</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                    <span className="w-6 text-center">#</span>
                    <span className="flex-1">Title</span>
                    <span className="w-20 text-right pr-2">Duration</span>
                    <span className="w-16 text-center">Actions</span>
                  </div>

                  {rows.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-2 p-1.5 rounded-md bg-canvas/60 border border-border/50 hover:border-border transition-colors group"
                    >
                      <span className="w-6 text-center text-xs font-mono text-text-muted">
                        {row.track_number}
                      </span>

                      <input
                        type="text"
                        placeholder="Track title"
                        value={row.title}
                        onChange={(e) =>
                          handleRowChange(index, "title", e.target.value)
                        }
                        className="flex-1 h-7 px-2 rounded bg-surface border border-border/70 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
                      />

                      <input
                        type="text"
                        placeholder="3:45"
                        value={row.duration_text}
                        onChange={(e) =>
                          handleRowChange(index, "duration_text", e.target.value)
                        }
                        className="w-20 h-7 px-2 rounded bg-surface border border-border/70 text-xs font-mono text-right text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-subtle"
                      />

                      <div className="w-16 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Move up"
                          className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === rows.length - 1}
                          title="Move down"
                          className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          title="Delete"
                          className="p-1 rounded text-text-muted hover:text-crimson transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-dashed border-border/80 hover:border-border text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add another track</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-text-muted space-y-1">
                <p>
                  Paste your tracklist below (one track per line). You can include track numbers and durations:
                </p>
                <p className="font-mono text-[11px] text-text-secondary/80 bg-canvas/70 p-2 rounded border border-border/40">
                  1. Dark Fantasy 4:40
                  <br />
                  2. Gorgeous - 5:57
                  <br />
                  3. POWER (4:52)
                </p>
              </div>

              <textarea
                rows={10}
                placeholder={"1. Track One (3:45)\n2. Track Two (4:10)\n3. Track Three"}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-3 rounded-md bg-canvas/70 border border-border text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-border-subtle"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  {pasteText.trim()
                    ? `${pasteText.trim().split(/\r?\n/).filter(Boolean).length} lines detected`
                    : "No text entered"}
                </span>

                <button
                  type="button"
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-text-primary hover:bg-white text-canvas text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Parse into rows</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-surface">
          <div className="text-xs text-text-muted">
            {rows.length > 0 && (
              <span>
                {rows.length} {rows.length === 1 ? "track" : "tracks"}
                {totalSeconds > 0 && ` \u00B7 ${formatSeconds(totalSeconds)} total`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || rows.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-text-primary hover:bg-white text-canvas text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Save Tracklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
