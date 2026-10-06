export interface ParsedTrack {
  track_number: number;
  title: string;
  duration_seconds: number | null;
}

/**
 * Converts seconds into a formatted string (e.g., 225 -> "3:45", 3725 -> "1:02:05")
 */
export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return "";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Converts a duration string (e.g. "3:45", "03:45", "1:02:15") to seconds.
 * Returns null if string is invalid or empty.
 */
export function parseDurationToSeconds(durationStr: string): number | null {
  if (!durationStr) return null;
  const cleaned = durationStr.trim().replace(/[()[\]]/g, "");
  const parts = cleaned.split(":").map((p) => p.trim());

  if (parts.some((p) => isNaN(Number(p)) || p === "")) {
    return null;
  }

  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs) || secs < 0 || secs >= 60 || mins < 0) return null;
    return mins * 60 + secs;
  }

  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    if (
      isNaN(hours) ||
      isNaN(mins) ||
      isNaN(secs) ||
      secs < 0 ||
      secs >= 60 ||
      mins < 0 ||
      mins >= 60 ||
      hours < 0
    ) {
      return null;
    }
    return hours * 3600 + mins * 60 + secs;
  }

  return null;
}

/**
 * Parses raw tracklist text into structured track entries.
 * Accommodates formats such as:
 * 1. Dark Fantasy (4:40)
 * 02 - Gorgeous 5:57
 * POWER 4:52
 * All of the Lights
 */
export function parseTracklistText(rawText: string): ParsedTrack[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: ParsedTrack[] = [];

  lines.forEach((line, index) => {
    // Skip disc / side section headers like "Disc 1", "CD 2", "Side A", "Bonus Tracks"
    if (/^(?:disc\s+\d+|cd\s*\d+|side\s+[a-z]|bonus\s+tracks?|act\s+\d+)[:\s]*$/i.test(line)) {
      return;
    }

    let text = line;
    let trackNum: number | null = null;
    let durationSeconds: number | null = null;

    // 1. Match duration at the end of the line (e.g., " - 3:45", "(3:45)", "[3:45]", or " 3:45")
    const durationRegex = /(?:[-–—\s(]|\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\)|\])?\s*$/;
    const durationMatch = text.match(durationRegex);
    if (durationMatch) {
      const durStr = durationMatch[1];
      const parsedDur = parseDurationToSeconds(durStr);
      if (parsedDur !== null) {
        durationSeconds = parsedDur;
        text = text.substring(0, durationMatch.index).trim();
      }
    }

    // 2. Match leading track number (e.g. "1.", "01.", "1 -", "1:", "1 ", "[1]", "(1)")
    const trackNumRegex = /^(?:\[|\()?(\d{1,3})(?:\]|\))?(?:[.:\-–—\s]+|\s+)/;
    const trackNumMatch = text.match(trackNumRegex);
    if (trackNumMatch) {
      const parsedNum = parseInt(trackNumMatch[1], 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        trackNum = parsedNum;
        text = text.substring(trackNumMatch[0].length).trim();
      }
    }

    // 3. Clean remaining text for title
    let title = text
      .replace(/^[-–—.:\s]+/, "")
      .replace(/[-–—.:\s]+$/, "")
      .trim();

    // If title was somehow enclosed in quotes, strip them
    if (
      (title.startsWith('"') && title.endsWith('"')) ||
      (title.startsWith("'") && title.endsWith("'"))
    ) {
      title = title.substring(1, title.length - 1).trim();
    }

    if (!title) {
      // In case line only had duration or number
      title = `Track ${trackNum || index + 1}`;
    }

    results.push({
      track_number: trackNum ?? index + 1,
      title,
      duration_seconds: durationSeconds,
    });
  });

  // Re-index track numbers consecutively if needed or keep existing
  return results.map((item, idx) => ({
    ...item,
    track_number: idx + 1,
  }));
}
