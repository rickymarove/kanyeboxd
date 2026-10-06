import { createClient } from "@/lib/supabase/server";
import { CrateShelfView } from "@/components/CrateShelfView";
import { Album, Review } from "@/lib/types";

export const revalidate = 0; // Dynamic server component

export default async function HomePage() {
  const defaultUserId = "00000000-0000-0000-0000-000000000001";
  let albums: Album[] = [];
  let reviews: Review[] = [];

  try {
    const supabase = await createClient();

    // Fetch albums
    const { data: albumsData, error: albumsError } = await supabase
      .from("albums")
      .select("*")
      .order("created_at", { ascending: true });

    if (!albumsError && albumsData) {
      albums = albumsData as Album[];
    }

    // Fetch user reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", defaultUserId);

    if (!reviewsError && reviewsData) {
      reviews = reviewsData as Review[];
    }
  } catch (err) {
    console.error("Error loading data from Supabase:", err);
  }

  return (
    <CrateShelfView
      initialAlbums={albums}
      initialReviews={reviews}
      defaultUserId={defaultUserId}
    />
  );
}
