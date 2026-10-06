-- 1. Function and trigger to auto-link first auth signup to the curator profile
create or replace function public.handle_owner_auth()
returns trigger as $$
begin
  -- If curator profile has no auth_user_id yet, claim it for this first user!
  update public.profiles
  set auth_user_id = new.id
  where id = '00000000-0000-0000-0000-000000000001' and auth_user_id is null;

  -- If not updated, create/ensure profile exists
  if not found then
    insert into public.profiles (id, auth_user_id, username, display_name)
    values (new.id, new.id, split_part(new.email, '@', 1), split_part(new.email, '@', 1))
    on conflict (id) do update set auth_user_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Revoke direct RPC execution from public/anon/authenticated roles
revoke execute on function public.handle_owner_auth() from public, anon, authenticated;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_owner_auth();

-- 2. Tighten RLS policies for reviews: public read, authenticated write
drop policy if exists "Enable all for reviews" on public.reviews;

create policy "Authenticated insert reviews" on public.reviews
for insert with check (auth.uid() is not null);

create policy "Authenticated update reviews" on public.reviews
for update using (auth.uid() is not null);

create policy "Authenticated delete reviews" on public.reviews
for delete using (auth.uid() is not null);

-- 3. Tighten RLS policies for albums: public read, authenticated write
drop policy if exists "Enable all for albums" on public.albums;

create policy "Authenticated insert albums" on public.albums
for insert with check (auth.uid() is not null);

create policy "Authenticated update albums" on public.albums
for update using (auth.uid() is not null);

create policy "Authenticated delete albums" on public.albums
for delete using (auth.uid() is not null);

-- 4. Tighten RLS policies for lists & list_items
drop policy if exists "Enable all for lists" on public.lists;
drop policy if exists "Enable all for list_items" on public.list_items;

create policy "Authenticated insert lists" on public.lists
for insert with check (auth.uid() is not null);

create policy "Authenticated update lists" on public.lists
for update using (auth.uid() is not null);

create policy "Authenticated delete lists" on public.lists
for delete using (auth.uid() is not null);

create policy "Authenticated insert list_items" on public.list_items
for insert with check (auth.uid() is not null);

create policy "Authenticated update list_items" on public.list_items
for update using (auth.uid() is not null);

create policy "Authenticated delete list_items" on public.list_items
for delete using (auth.uid() is not null);
