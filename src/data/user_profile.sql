-- Role system for Airbnb users
CREATE TYPE airbnb_user_role AS ENUM ('guest', 'host', 'admin');

-- User profile table
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar_url text default '',
  bio text default '',
  role airbnb_user_role default 'guest',
  created_at timestamptz default now()
);