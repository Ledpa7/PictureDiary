-- 1. Add subscription status column to profiles table
alter table profiles add column if not exists is_subscribed boolean default false;

-- 2. Add private diary column to diaries table
alter table diaries add column if not exists is_private boolean default false;

-- 3. Drop existing select policy for diaries
drop policy if exists "Diaries are viewable by everyone." on diaries;

-- 4. Recreate select policy to enforce private diaries
create policy "Diaries are viewable by everyone if public, or by the owner."
on diaries for select
using (
  is_private = false or auth.uid() = user_id
);
