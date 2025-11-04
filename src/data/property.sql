-- Property table
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(user_id) on delete cascade,
  name text not null,
  description text,
  location text,
  price_per_night numeric(10,2) not null,
  availability boolean default true,
  created_at timestamptz default now()
);
