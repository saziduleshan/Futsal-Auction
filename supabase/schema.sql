create extension if not exists pgcrypto;

create type division_t as enum ('men', 'women');
create type player_category_t as enum ('defender', 'midfielder', 'forward', 'goalkeeper');
create type player_status_t as enum ('available', 'sold', 'unsold');
create type auction_status_t as enum ('idle', 'live', 'sold', 'unsold');
create type user_role_t as enum ('admin', 'team');

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  division division_t not null,
  purse integer not null default 1000,
  accent_color text,
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null,
  role user_role_t not null,
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  division division_t not null,
  category player_category_t not null,
  base_price integer not null default 50,
  status player_status_t not null default 'available',
  card_image_url text,
  sold_price integer,
  sold_to_team_id uuid references teams(id) on delete set null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists auction_rooms (
  id uuid primary key default gen_random_uuid(),
  division division_t not null unique,
  current_player_id uuid references players(id) on delete set null,
  current_bid integer not null default 0,
  current_highest_team_id uuid references teams(id) on delete set null,
  bid_increment integer not null default 10,
  status auction_status_t not null default 'idle',
  nominated_at timestamptz
);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references auction_rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;
alter table players enable row level security;
alter table auction_rooms enable row level security;
alter table bids enable row level security;

create policy "Public can read teams" on teams for select using (true);
create policy "Public can read players" on players for select using (true);
create policy "Public can read auction_rooms" on auction_rooms for select using (true);
create policy "Public can read bids" on bids for select using (true);

insert into teams (name, slug, division, purse, accent_color) values
('Men Team 1', 'men-team-1', 'men', 1000, '#11d5ff'),
('Men Team 2', 'men-team-2', 'men', 1000, '#ff3cac'),
('Men Team 3', 'men-team-3', 'men', 1000, '#a3ff12'),
('Men Team 4', 'men-team-4', 'men', 1000, '#f8cf52'),
('Men Team 5', 'men-team-5', 'men', 1000, '#7df9ff'),
('Men Team 6', 'men-team-6', 'men', 1000, '#ff7a18'),
('Men Team 7', 'men-team-7', 'men', 1000, '#9b5cff'),
('Men Team 8', 'men-team-8', 'men', 1000, '#00f5a0'),
('Women Team 1', 'women-team-1', 'women', 1000, '#11d5ff'),
('Women Team 2', 'women-team-2', 'women', 1000, '#ff3cac'),
('Women Team 3', 'women-team-3', 'women', 1000, '#a3ff12')
on conflict (slug) do nothing;

insert into auction_rooms (division, bid_increment, status)
values ('men', 10, 'idle'), ('women', 10, 'idle')
on conflict (division) do nothing;

insert into app_users (username, password_hash, display_name, role, team_id) values
('admin', '53f4de3d8580caea4011a850ad3490dc:8fc4498c9be3b2f2f45975ad71932a207b4344e03e5365217e8146e3b72372d998149e052e228b8a1cb4c318e6f37134ef333764b7db7b105690c78603fe0285', 'Auction Admin', 'admin', null),
('mteam1', '67fc2601d26b885cd8cb75ad3443d8b0:29f6cd4eb4cc77227c53d9887abd08af89ab4ae4078118080aeb929f335075440929f29ef37b6a3ff505ec7cdc385ecfa81a13d0aedd32d33878dedc78e2b653', 'Men Team 1 Manager', 'team', (select id from teams where slug = 'men-team-1')),
('mteam2', 'b95fdf9778ee11ab2d491c91661051b8:eff599b243914f1a4ce48cf540230c9e5ebffdfb939616b99908142fdf331f19c7e2584d74499a1277cbaeca223d65c223b8343b9a4ff5170ab2137a0d7a6cce', 'Men Team 2 Manager', 'team', (select id from teams where slug = 'men-team-2')),
('mteam3', '75332905fb5f3960379e613c3f857a2f:7863cc16db616c62b4ba3198af6d0fe671de8bb35d963875c2377a10d7b893eaf67437412de6c6965d198d8fb4556a8a2f797a99195d49e800f4c742df17effc', 'Men Team 3 Manager', 'team', (select id from teams where slug = 'men-team-3')),
('mteam4', '0e1a4d8b8aafbfcf9ef64ab5ecc02a5c:9513b9040f99fa5fc738a851d7de3256527e1583d2eb9cd1b4b4a0ae1f73bf5d01f4a4665cd96d5007af2ca221e7916b469000955133a538f7b56cc259eea0a2', 'Men Team 4 Manager', 'team', (select id from teams where slug = 'men-team-4')),
('mteam5', '2b6515c27fde64b48afac987dc3030bf:a280105e51c9b807ba1e0f84c55055ad82a53ad3bcfd1707476bdb25f8f5da94f40acf8106dffc4dc57a3ea85c898720661030b47194ca0215e05d81ac1de42d', 'Men Team 5 Manager', 'team', (select id from teams where slug = 'men-team-5')),
('mteam6', 'f1c56bde0188ee979d88b6c50edf282d:38d1c157d50c022670c10a6215251ea6b90c3a76298a08c80dbd8a9171ec78e8f7233e85b50cf9ab9d89987d79e6aa32ed0f0b8c47442559e74608ddc5f384c1', 'Men Team 6 Manager', 'team', (select id from teams where slug = 'men-team-6')),
('mteam7', '85a31584516da6b3973289baab7db609:2d6124bee5eb301649d6548330ae3b617f7a3aa6f6c41db49fe4c31ef41226b7e78c6e5f8d716354941e142ccefcd465a59917518b3b2fb86f8d19ad7e8bce39', 'Men Team 7 Manager', 'team', (select id from teams where slug = 'men-team-7')),
('mteam8', 'ec672b79adcbfef6babe451eb3ea2a29:ac23db8c49c83111342f2122fdc3d68d02ca810140f81e19686316f3ad8ec15d882ec951dd7042b6826b3ac563bcb9fe8a003bbbe002948949e18d670f721344', 'Men Team 8 Manager', 'team', (select id from teams where slug = 'men-team-8')),
('fteam1', '1ec33516ad85072092119b4c5534a42e:07e0373e46bb1ad1bf4c446560e7f469a9ed5483835af2bd9bfc25cf339ea12e185e8aeb5e7754d8d79851353873d250c8b0304ecda3063103f9b7c2415490e2', 'Women Team 1 Manager', 'team', (select id from teams where slug = 'women-team-1')),
('fteam2', '1a74c1fc216b0ec2362569450a1c6299:e4e400f4ff8bc1ffaa8dc46379dd96a4010848b3108d21db17a55a9049f6e36582c214a51fb08d1d19d0b94d29611543a28262faec816cc1ead284582e1f8b61', 'Women Team 2 Manager', 'team', (select id from teams where slug = 'women-team-2')),
('fteam3', 'd610b4229b9fbccd19054fc9b433959f:74ec4e181a758493540bc70f48b3627d00b2c038d3c2ca6399eef4db6ede735511af1787e3a0d1977958485547854f90cd1ef06fddea697fcb6177c41b748d61', 'Women Team 3 Manager', 'team', (select id from teams where slug = 'women-team-3'))
on conflict (username) do nothing;

insert into storage.buckets (id, name, public)
values ('player-cards', 'player-cards', true)
on conflict (id) do nothing;

create policy "Public can read player cards" on storage.objects
for select using (bucket_id = 'player-cards');

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table auction_rooms;
alter publication supabase_realtime add table bids;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references auction_rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  price integer not null,
  created_at timestamptz not null default now()
);

alter table purchases enable row level security;
create policy "Public can read purchases" on purchases for select using (true);

alter publication supabase_realtime add table purchases;

create table if not exists auction_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references auction_rooms(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(room_id, team_id)
);

alter table auction_participants enable row level security;
create policy "Participants can read own" on auction_participants for select using (true);
create policy "Participants can insert own" on auction_participants for insert with check (true);
create policy "Participants can update own" on auction_participants for update using (true);

alter publication supabase_realtime add table auction_participants;

-- ═══════════════════════════════════════════════
-- MIGRATION: add connected column (run if upgrading)
-- ═══════════════════════════════════════════════
-- alter table auction_participants add column connected boolean not null default true;

-- ═══════════════════════════════════════════════
-- MIGRATION: add join_code column (run if upgrading)
-- ═══════════════════════════════════════════════
-- alter table auction_rooms add column join_code text;

-- ═══════════════════════════════════════════════
-- MIGRATION: add ended_at column (run if upgrading)
-- ═══════════════════════════════════════════════
-- alter table auction_rooms add column ended_at timestamptz;
--
-- During end auction, set ended_at = now() to mark completion
-- instead of deleting purchases. Purchases remain visible in
-- auction history until admin explicitly resets teams.

-- ═══════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════
create index if not exists idx_bids_room_id on bids(room_id);
create index if not exists idx_bids_player_id on bids(player_id);
create index if not exists idx_bids_created_at on bids(created_at desc);
create index if not exists idx_purchases_room_id on purchases(room_id);
create index if not exists idx_purchases_team_id on purchases(team_id);
create index if not exists idx_players_division_status on players(division, status);
create index if not exists idx_participants_room_team on auction_participants(room_id, team_id);
