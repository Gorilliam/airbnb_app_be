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

-- Trigger to automatically create profile when new user signs up
CREATE OR REPLACE FUNCTION public.create_airbnb_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_airbnb_profile_trigger ON auth.users;

CREATE TRIGGER create_airbnb_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_airbnb_profile();

-- Backfill profiles for existing users
INSERT INTO public.user_profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;