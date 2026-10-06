"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  value: number | null | undefined;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function RatingStars({
  value = 0,
  onChange,
  readOnly = false,
  size = "md",
  showValue = false,
}: RatingStarsProps) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const currentVal = hoverVal !== null ? hoverVal : (value ?? 0);

  const starSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-5 h-5",
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) => {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverVal(isHalf ? starIndex - 0.5 : starIndex);
  };

  const handleClick = (starIndex: number) => {
    if (readOnly || !onChange) return;
    const target = hoverVal ?? starIndex;
    if (value === target) {
      onChange(0);
    } else {
      onChange(target);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 select-none" onMouseLeave={() => setHoverVal(null)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = currentVal >= starIndex;
          const half = !filled && currentVal >= starIndex - 0.5;

          return (
            <button
              key={starIndex}
              type="button"
              disabled={readOnly}
              aria-label={`Rate ${starIndex} stars`}
              className={`relative transition-opacity ${
                readOnly
                  ? "cursor-default"
                  : "cursor-pointer hover:opacity-80"
              }`}
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onClick={() => handleClick(starIndex)}
            >
              {half ? (
                <div className="relative">
                  <Star
                    className={`${starSizes[size]} text-border fill-transparent`}
                    strokeWidth={1.25}
                  />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star
                      className={`${starSizes[size]} text-amber fill-amber`}
                      strokeWidth={1.25}
                    />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${starSizes[size]} ${
                    filled
                      ? "text-amber fill-amber"
                      : "text-border fill-transparent"
                  }`}
                  strokeWidth={1.25}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-[11px] font-medium text-text-secondary ml-1 tracking-tight">
          {currentVal > 0 ? currentVal.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}
