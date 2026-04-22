-- Enable RLS
alter table profiles enable row level security;
alter table diaries enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;

-- Profiles: Public Read, Auth User Update Own
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Diaries: Public Read (Gallery), Auth User Insert/Update/Delete Own
create policy "Diaries are viewable by everyone." on diaries for select using ( true );
create policy "Users can insert their own diary." on diaries for insert with check ( auth.uid() = user_id );
create policy "Users can update own diary." on diaries for update using ( auth.uid() = user_id );
create policy "Users can delete own diary." on diaries for delete using ( auth.uid() = user_id );

-- Likes: Public Read, Auth User Insert/Delete Own
create policy "Likes are viewable by everyone." on likes for select using ( true );
create policy "Users can insert their own likes." on likes for insert with check ( auth.uid() = user_id );
create policy "Users can delete own likes." on likes for delete using ( auth.uid() = user_id );

-- Comments: Public Read, Auth User Insert/Delete Own
create policy "Comments are viewable by everyone." on comments for select using ( true );
create policy "Users can insert their own comments." on comments for insert with check ( auth.uid() = user_id );
create policy "Users can delete own comments." on comments for delete using ( auth.uid() = user_id );
