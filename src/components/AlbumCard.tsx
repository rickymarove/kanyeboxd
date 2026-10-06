"use client";

import React from "react";
import { AlbumWithReview } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { Heart, Disc, Music, Plus } from "lucide-react";

interface AlbumCardProps {
  album: AlbumWithReview;
  onRate: (album: AlbumWithReview) => void;
  onViewDetails: (album: AlbumWithReview) => void;
}

export function AlbumCard({ album, onRate, onViewDetails }: AlbumCardProps) {
  const review = album.review;
  const isRated = review && review.rating !== null && review.rating > 0;
  const isFavorite = review?.is_favorite ?? false;

  return (
    <div className="vinyl-card group rounded-lg overflow-hidden flex flex-col">
      {/* Vinyl Jacket Artwork Container */}
      <div
        className="relative aspect-square w-full bg-surface-raised overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(album)}
      >
        {album.cover_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={album.cover_url}
            alt={`${album.title} by ${album.artist}`}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-raised text-text-muted p-4 text-center">
            <Disc className="w-12 h-12 mb-2 stroke-1 opacity-50" />
            <span className="text-xs font-mono">No Sleeve Art</span>
          </div>
        )}

        {/* Tactile vinyl sleeve edge & gradient shadow */}
        <div className="absolute inset-0 pointer-events-none vinyl-sleeve-edge bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Favorite marker badge */}
        {isFavorite && (
          <div className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/75 backdrop-blur-md flex items-center justify-center text-crimson shadow-md">
            <Heart className="w-3.5 h-3.5 fill-crimson" />
          </div>
        )}

        {/* Release year pill */}
        {album.release_year && (
          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md font-mono text-[11px] font-medium text-text-secondary">
            {album.release_year}
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRate(album);
            }}
            className="w-full max-w-[140px] py-1.5 px-3 rounded-md bg-amber hover:bg-amber/90 text-canvas text-xs font-semibold tracking-wide transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Music className="w-3.5 h-3.5" />
            <span>{isRated ? "Edit Log" : "Rate Album"}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(album);
            }}
            className="w-full max-w-[140px] py-1.5 px-3 rounded-md bg-surface-raised/90 hover:bg-surface-raised text-text-primary text-xs font-medium border border-border transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Liner Notes</span>
          </button>
        </div>
      </div>

      {/* Album Info Footer */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3
            onClick={() => onViewDetails(album)}
            title={album.title}
            className="font-medium text-sm text-text-primary hover:text-amber transition-colors line-clamp-1 cursor-pointer"
          >
            {album.title}
          </h3>
          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
            {album.artist}
          </p>
        </div>

        {/* Rating row or unrated call to action */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
          {isRated ? (
            <div className="flex items-center gap-1.5">
              <RatingStars
                value={review.rating}
                readOnly
                size="sm"
                showValue
              />
            </div>
          ) : (
            <button
              onClick={() => onRate(album)}
              className="text-[11px] font-mono text-text-muted hover:text-amber flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Log listen</span>
            </button>
          )}

          {album.genres && album.genres.length > 0 && (
            <span className="text-[10px] font-mono text-text-muted truncate max-w-[90px]">
              {album.genres[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
