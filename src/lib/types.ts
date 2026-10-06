export interface Profile {
  id: string;
  auth_user_id: string | null;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  release_year: number | null;
  cover_url: string | null;
  genres: string[];
  spotify_id: string | null;
  track_count: number;
  created_at: string;
}

export interface Track {
  id: string;
  album_id: string;
  track_number: number;
  title: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  album_id: string;
  rating: number | null; // 0.5 to 5.0
  review_text: string | null;
  is_favorite: boolean;
  favorite_tracks: string[];
  listened_on: string;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithReview extends Album {
  review?: Review | null;
  tracks?: Track[];
}

export interface UserStats {
  totalRated: number;
  averageRating: number;
  favoriteCount: number;
  recentListens: number;
}
