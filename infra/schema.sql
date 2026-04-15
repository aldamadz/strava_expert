create extension if not exists postgis;

create table if not exists users (
  id uuid primary key,
  email text unique not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  sport_type text not null,
  distance_m integer not null default 0,
  moving_time_s integer not null default 0,
  elapsed_time_s integer not null default 0,
  elevation_gain_m integer not null default 0,
  started_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists gps_points (
  id bigserial primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  seq integer not null,
  lat double precision not null,
  lon double precision not null,
  altitude_m double precision,
  heart_rate integer,
  cadence integer,
  recorded_at timestamptz not null
);

create table if not exists segments (
  id uuid primary key,
  name text not null,
  distance_m integer not null,
  elevation_gain_m integer not null,
  created_at timestamptz not null default now()
);

create table if not exists activity_segment_efforts (
  id uuid primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  segment_id uuid not null references segments(id) on delete cascade,
  elapsed_time_s integer not null,
  avg_watts integer,
  avg_heart_rate integer,
  created_at timestamptz not null default now()
);

create table if not exists kudos (
  id uuid primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create table if not exists training_plans (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  plan_name text not null,
  goal_event text,
  target_date date,
  weekly_volume_target_km integer,
  created_at timestamptz not null default now()
);
