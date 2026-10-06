-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Albums Table
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  release_year integer,
  cover_url text,
  genres text[] default '{}',
  spotify_id text,
  track_count integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_albums_artist_title on public.albums(artist, title);

-- 3. Tracks Table
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  track_number integer not null,
  title text not null,
  duration_seconds integer,
  created_at timestamptz default now()
);

create index if not exists idx_tracks_album_id on public.tracks(album_id);

-- 4. Reviews / Ratings Table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  rating numeric(3,1) check (rating >= 0 and rating <= 5),
  review_text text,
  is_favorite boolean default false,
  favorite_tracks text[] default '{}',
  listened_on date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, album_id)
);

create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_album_id on public.reviews(album_id);

-- 5. Lists Table
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  is_private boolean default true,
  created_at timestamptz default now()
);

-- 6. List Items Table
create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  album_id uuid not null references public.albums(id) on delete cascade,
  position integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  unique(list_id, album_id)
);

create index if not exists idx_list_items_list_id on public.list_items(list_id);

-- Updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = public;

create trigger trigger_reviews_updated_at
before update on public.reviews
for each row execute function public.handle_updated_at();

create trigger trigger_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.reviews enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- RLS Policies
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Enable all for profiles" on public.profiles for all using (true) with check (true);

create policy "Public read albums" on public.albums for select using (true);
create policy "Enable all for albums" on public.albums for all using (true) with check (true);

create policy "Public read tracks" on public.tracks for select using (true);
create policy "Enable all for tracks" on public.tracks for all using (true) with check (true);

create policy "Public read reviews" on public.reviews for select correlations using (true);
create policy "Enable all for reviews" on public.reviews for all using (true) with check (true);

create policy "Public read lists" on public.lists for select using (true);
create policy "Enable all for lists" on public.lists for all using (true) with check (true);

create policy "Public read list_items" on public.list_items for select using (true);
create policy "Enable all for list_items" on public.list_items for all using (true) with check (true);

-- Seed default curator profile
insert into public.profiles (id, username, display_name, bio)
values (
  '00000000-0000-0000-0000-000000000001',
  'curator',
  'Vinyl Curator',
  'Private listening archive & record rating journal.'
)
on conflict (id) do nothing;

-- Seed albums
insert into public.albums (id, title, artist, release_year, cover_url, genres, track_count)
values
  ('11111111-1111-1111-1111-111111111101', 'My Beautiful Dark Twisted Fantasy', 'Kanye West', 2010, 'https://upload.wikimedia.org/wikipedia/en/b/be/MBDTF_Alt.jpg', array['Hip Hop', 'Art Pop', 'Progressive Rap'], 13),
  ('11111111-1111-1111-1111-111111111102', 'Graduation', 'Kanye West', 2007, 'https://upload.wikimedia.org/wikipedia/en/7/70/Graduation_%28album%29.jpg', array['Hip Hop', 'Electropop'], 13),
  ('11111111-1111-1111-1111-111111111103', 'The College Dropout', 'Kanye West', 2004, 'https://upload.wikimedia.org/wikipedia/en/a/a3/Kanyewest_collegedropout.jpg', array['Hip Hop', 'Chipmunk Soul'], 21),
  ('11111111-1111-1111-1111-111111111104', 'Yeezus', 'Kanye West', 2013, 'https://upload.wikimedia.org/wikipedia/en/0/03/Yeezus_album_cover.png', array['Industrial Hip Hop', 'Experimental'], 10),
  ('11111111-1111-1111-1111-111111111105', 'To Pimp a Butterfly', 'Kendrick Lamar', 2015, 'https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png', array['Conscious Hip Hop', 'Jazz Rap', 'Funk'], 16),
  ('11111111-1111-1111-1111-111111111106', 'Blonde', 'Frank Ocean', 2016, 'https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg', array['R&B', 'Neo-Soul', 'Avant-Garde'], 17),
  ('11111111-1111-1111-1111-111111111107', 'Discovery', 'Daft Punk', 2001, 'https://upload.wikimedia.org/wikipedia/en/a/ae/Daft_Punk_-_Discovery.jpg', array['French House', 'Electronic', 'Synthpop'], 14),
  ('11111111-1111-1111-1111-111111111108', 'In Rainbows', 'Radiohead', 2007, 'https://upload.wikimedia.org/wikipedia/en/1/14/Inrainbowscover.png', array['Art Rock', 'Alternative Rock'], 10),
  ('11111111-1111-1111-1111-111111111109', 'IGOR', 'Tyler, the Creator', 2019, 'https://upload.wikimedia.org/wikipedia/en/5/51/Igor_-_Tyler%2C_the_Creator.jpg', array['Neo-Soul', 'Hip Hop', 'Funk'], 12),
  ('11111111-1111-1111-1111-111111111110', 'Kind of Blue', 'Miles Davis', 1959, 'https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg', array['Modal Jazz', 'Hard Bop'], 5)
on conflict (id) do nothing;

-- Seed key tracks for MBDTF
insert into public.tracks (album_id, track_number, title, duration_seconds)
values
  ('11111111-1111-1111-1111-111111111101', 1, 'Dark Fantasy', 280),
  ('11111111-1111-1111-1111-111111111101', 2, 'Gorgeous', 357),
  ('11111111-1111-1111-1111-111111111101', 3, 'POWER', 292),
  ('11111111-1111-1111-1111-111111111101', 4, 'All of the Lights', 299),
  ('11111111-1111-1111-1111-111111111101', 5, 'Monster', 378),
  ('11111111-1111-1111-1111-111111111101', 6, 'So Appalled', 398),
  ('11111111-1111-1111-1111-111111111101', 7, 'Devil in a New Dress', 352),
  ('11111111-1111-1111-1111-111111111101', 8, 'Runaway', 548),
  ('11111111-1111-1111-1111-111111111101', 9, 'Hell of a Life', 327),
  ('11111111-1111-1111-1111-111111111101', 10, 'Blame Game', 469),
  ('11111111-1111-1111-1111-111111111101', 11, 'Lost in the World', 256),
  ('11111111-1111-1111-1111-111111111101', 12, 'Who Will Survive in America', 98)
on conflict do nothing;

-- Seed initial review for MBDTF
insert into public.reviews (user_id, album_id, rating, review_text, is_favorite, favorite_tracks, listened_on)
values (
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111101',
  5.0,
  'Maximalist perfection. From the Mike Oldfield chops on Dark Fantasy to the 9-minute vocoder outro on Runaway, it remains an untouchable benchmark in 21st century hip-hop production.',
  true,
  array['Runaway', 'Devil in a New Dress'],
  current_date
)
on conflict (user_id, album_id) do nothing;
