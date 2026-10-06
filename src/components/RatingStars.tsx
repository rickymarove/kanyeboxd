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
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-6 h-6",
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
    // Clicking the same value clears it
    if (value === target) {
      onChange(0);
    } else {
      onChange(target);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 select-none" onMouseLeave={() => setHoverVal(null)}>
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
              className={`relative transition-transform ${
                readOnly
                  ? "cursor-default"
                  : "cursor-pointer hover:scale-110 active:scale-95"
              }`}
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onClick={() => handleClick(starIndex)}
            >
              {half ? (
                <div className="relative">
                  {/* Empty star background */}
                  <Star
                    className={`${starSizes[size]} text-border fill-transparent`}
                    strokeWidth={1.5}
                  />
                  {/* Half-filled overlay */}
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star
                      className={`${starSizes[size]} text-amber fill-amber`}
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${starSizes[size]} ${
                    filled
                      ? "text-amber fill-amber drop-shadow-[0_0_8px_rgba(229,169,60,0.3)]"
                      : "text-border fill-transparent"
                  }`}
                  strokeWidth={1.5}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-mono text-xs font-semibold tracking-tight text-amber ml-1">
          {currentVal > 0 ? currentVal.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}
