"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DateSelectorProps {
  value: string; // ISO date string: YYYY-MM-DD
  onChange: (date: string) => void;
  className?: string;
}

export function DateSelector({ value, onChange, className = "" }: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewDate, setViewDate] = useState<Date>(() =>
    value ? new Date(value + "T00:00:00") : new Date()
  );

  const handleOpenToggle = () => {
    if (!isOpen) {
      setViewDate(value ? new Date(value + "T00:00:00") : new Date());
    }
    setIsOpen(!isOpen);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Generate days in month
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Helper to check if a day is the selected date
  const isSelected = (day: number) => {
    if (!value) return false;
    const parts = value.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return y === viewYear && m === viewMonth && d === day;
  };

  // Helper to check if a day is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateString = `${viewYear}-${mm}-${dd}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    onChange(todayStr);
    setViewDate(today);
    setIsOpen(false);
  };

  // Format display string
  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return "Select date";
    try {
      const d = new Date(isoStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenToggle}
        className="w-full h-9 px-3 rounded-md bg-surface border border-border text-xs text-text-primary flex items-center justify-between hover:border-border-subtle focus:outline-none focus:border-border-subtle transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span>{formatDisplayDate(value)}</span>
        </span>
        <span className="text-[10px] font-mono text-text-muted">
          {value || ""}
        </span>
      </button>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-50 w-64 rounded-lg bg-surface border border-border shadow-2xl p-3 animate-in fade-in duration-100 select-none">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
            <span className="text-xs font-semibold text-text-primary">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
              <span
                key={dayName}
                className="text-[10px] font-medium text-text-muted py-0.5"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-7" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded text-xs flex items-center justify-center transition-colors cursor-pointer relative ${
                    selected
                      ? "bg-text-primary text-canvas font-semibold"
                      : "text-text-primary hover:bg-surface-raised"
                  } ${today && !selected ? "border border-border-subtle font-medium text-amber" : ""}`}
                >
                  <span>{day}</span>
                  {today && !selected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] text-text-secondary hover:text-text-primary font-medium transition-colors cursor-pointer"
            >
              Today
            </button>
            <span className="text-[10px] font-mono text-text-muted">
              {value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
