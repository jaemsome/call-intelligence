-- Run once on a fresh project (not idempotent).
-- PestLaunch Call Intelligence — full schema (runnable from scratch)
create extension if not exists pgcrypto;

create type call_status as enum ('uploaded','transcribing','transcribed','classifying','classified','scoring','done','failed');
create type call_type as enum ('sales','retention','reservice','scheduling','billing','other_service','not_scorable');
create type scorecard_kind as enum ('sales_17','all_calls_12','retention_12');
create type call_direction as enum ('inbound','outbound','unknown');
create type call_outcome as enum ('booked','not_booked','follow_up','saved','cancelled','resolved','unresolved','no_outcome');
create type grade as enum ('gold','green','below');

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table reps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  storage_path text not null,
  duration_sec int,
  status call_status not null default 'uploaded',
  status_at timestamptz not null default now(),
  error text,
  failed_step text check (failed_step in ('transcribe','classify','score')),
  call_type call_type,
  not_scorable_reason text,
  scorecard scorecard_kind,
  direction call_direction,
  rep_id uuid references reps(id) on delete set null,
  rep_speaker int,
  customer_name text,
  outcome call_outcome,
  summary text,
  details jsonb,
  score int,
  max_score int,
  grade grade,
  needs_review boolean not null default false,
  coaching jsonb,
  ai_provider text,
  ai_model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index calls_created_at_idx on calls (created_at desc);
create index calls_rep_idx on calls (rep_id);
create index calls_type_idx on calls (call_type);

create table transcript_segments (
  id bigserial primary key,
  call_id uuid not null references calls(id) on delete cascade,
  idx int not null,
  speaker int not null,
  role text not null default 'unknown' check (role in ('rep','customer','unknown')),
  start_ms int not null,
  end_ms int not null,
  text text not null,
  unique (call_id, idx)
);

create table scorecard_results (
  id bigserial primary key,
  call_id uuid not null references calls(id) on delete cascade,
  item_key text not null,
  quadrant text not null,
  status text not null check (status in ('hit','miss','na')),
  line_idx int,
  quote text,
  verified boolean not null default false,
  note text not null default '',
  unique (call_id, item_key)
);
create index scorecard_results_call_idx on scorecard_results (call_id);

-- RLS on, no policies: only the service role (server-side) can read or write.
alter table admin_users enable row level security;
alter table reps enable row level security;
alter table calls enable row level security;
alter table transcript_segments enable row level security;
alter table scorecard_results enable row level security;

-- Data API exposure is disabled by default: grant only the server role (service_role) access.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Private bucket for recordings (50 MB cap, audio only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recordings', 'recordings', false, 52428800,
        array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a','audio/m4a'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
