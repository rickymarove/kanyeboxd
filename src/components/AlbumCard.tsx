"use client";

import React from "react";
import { AlbumWithReview } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { Heart, Disc } from "lucide-react";

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
    <div className="group flex flex-col select-none">
      {/* Album Artwork Cover */}
      <div
        className="relative aspect-square w-full rounded-md bg-surface overflow-hidden border border-border/60 hover:border-border transition-colors cursor-pointer"
        onClick={() => onViewDetails(album)}
      >
        {album.cover_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={album.cover_url}
            alt={`${album.title} by ${album.artist}`}
            className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted p-4">
            <Disc className="w-8 h-8 opacity-40 stroke-1 mb-1" />
            <span className="text-[11px] text-text-muted">No Artwork</span>
          </div>
        )}

        {/* Favorite marker */}
        {isFavorite && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-crimson">
            <Heart className="w-3 h-3 fill-crimson" />
          </div>
        )}

        {/* Hover quick-rate overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRate(album);
            }}
            className="w-full py-1.5 px-3 rounded bg-surface/90 hover:bg-surface text-text-primary text-[11px] font-medium border border-border/80 backdrop-blur-md transition-colors cursor-pointer"
          >
            {isRated ? "Edit log" : "Log album"}
          </button>
        </div>
      </div>

      {/* Album Info */}
      <div className="pt-2.5 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <h3
            onClick={() => onViewDetails(album)}
            title={album.title}
            className="text-xs font-medium text-text-primary hover:text-text-secondary transition-colors line-clamp-1 cursor-pointer"
          >
            {album.title}
          </h3>
        </div>

        <p className="text-[11px] text-text-muted line-clamp-1">
          {album.artist}
          {album.release_year ? ` · ${album.release_year}` : ""}
        </p>

        {/* Rating row */}
        <div className="pt-0.5 flex items-center justify-between min-h-[18px]">
          {isRated ? (
            <RatingStars
              value={review.rating}
              readOnly
              size="sm"
              showValue
            />
          ) : (
            <span className="text-[11px] text-text-muted/60">Not rated</span>
          )}

          {album.genres && album.genres.length > 0 && (
            <span className="text-[10px] text-text-muted/70 truncate max-w-[80px]">
              {album.genres[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
