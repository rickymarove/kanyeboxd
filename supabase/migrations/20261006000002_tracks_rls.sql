-- Tighten RLS policies on public.tracks: public read, authenticated write
do $$
begin
  if exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'tracks' and policyname = 'Enable all for tracks'
  ) then
    execute 'drop policy "Enable all for tracks" on public.tracks';
  end if;
end $$;

drop policy if exists "Authenticated insert tracks" on public.tracks;
create policy "Authenticated insert tracks" on public.tracks
for insert with check (auth.uid() is not null);

drop policy if exists "Authenticated update tracks" on public.tracks;
create policy "Authenticated update tracks" on public.tracks
for update using (auth.uid() is not null);

drop policy if exists "Authenticated delete tracks" on public.tracks;
create policy "Authenticated delete tracks" on public.tracks
for delete using (auth.uid() is not null);
