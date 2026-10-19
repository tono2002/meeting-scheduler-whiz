create extension if not exists btree_gist;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^[67][0-9]{8}$'),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint bookings_duration check (slot_end = slot_start + interval '90 minutes'),
  constraint bookings_no_overlap exclude using gist (
    tstzrange(slot_start, slot_end, '[)') with &&
  ) where (status = 'confirmed')
);

-- Max one active booking per phone.
create unique index if not exists bookings_one_active_per_phone
  on public.bookings (phone) where (status = 'confirmed');

-- RLS on, no policies: only the service role (server routes) can access the table.
alter table public.bookings enable row level security;
revoke all on public.bookings from anon, authenticated;
