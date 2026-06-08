create extension if not exists pgcrypto;

create type division_t as enum ('men', 'women');
create type player_status_t as enum ('available', 'sold', 'unsold');
create type auction_status_t as enum ('idle', 'live', 'sold', 'unsold');
create type user_role_t as enum ('admin', 'moderator', 'team');
alter type user_role_t add value if not exists 'moderator';

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
('Los Matadores', 'los-matadores', 'men', 1000, '#11d5ff'),
('Flying Dutchmen', 'flying-dutchmen', 'men', 1000, '#ff3cac'),
('Baguette Battalion', 'baguette-battalion', 'men', 1000, '#a3ff12'),
('The Wurst Case Scenario', 'the-wurst-case-scenario', 'men', 1000, '#f8cf52'),
('M10', 'm10', 'men', 1000, '#7df9ff'),
('Cai Cai FC', 'cai-cai-fc', 'men', 1000, '#ff7a18'),
('Siuuperstars', 'siuuperstars', 'men', 1000, '#9b5cff'),
('Iniestagram Influencers', 'iniestagram-influencers', 'men', 1000, '#00f5a0'),
('Inazuma Eleven', 'inazuma-eleven', 'women', 1000, '#11d5ff'),
('The Colonizers FC', 'the-colonizers-fc', 'women', 1000, '#ff3cac'),
('Hazardous XI', 'hazardous-xi', 'women', 1000, '#a3ff12')
on conflict (slug) do nothing;

insert into auction_rooms (division, bid_increment, status)
values ('men', 10, 'idle'), ('women', 10, 'idle')
on conflict (division) do nothing;

insert into app_users (username, password_hash, display_name, role, team_id) values
('admin', '53f4de3d8580caea4011a850ad3490dc:8fc4498c9be3b2f2f45975ad71932a207b4344e03e5365217e8146e3b72372d998149e052e228b8a1cb4c318e6f37134ef333764b7db7b105690c78603fe0285', 'Auction Admin', 'admin', null),
('moderator1', '29163569dc755f0bdf9719f39d465a9d:1effd64037c8b82d6b0e82b7d88079fa5ef30079b4afd51ae4457fe72338f3e24dc3d155cd349ff90a1cac97fa3136975642018c1f0908bdf2841f38cc71a3ea', 'Moderator 1', 'moderator', null),
('moderator2', '6fa7fa321f0233d33e78baff51f1ed9d:3e6e45205f08c4abdefdd188b4efe965483dc9f63405d62aecb476e530bb5b6a0f230971285f4085832dfc4f2bdb326e58699a4ae0d6b656d31218260b36a55c', 'Moderator 2', 'moderator', null),
('moderator3', 'c8f75cdb26f458dd0d9b1db1c226fa6b:b7a164b48a1d7e0f0f88ad9043ab1fb4e475a80c297c36a2aa6d9964bcccb4079e0b651fc1e64a69337b92c00f4a2821973d216857b1d1473968245ce3d03885', 'Moderator 3', 'moderator', null),
('losmatadores', 'ba889fd76a745e3572660309eb627b8c:633b231e5e798e5938852be139e533a54bc50eb7d08fc008fba062d7613a6afc07c5d6a4f818859a46d5496fa77da1da464a1b5c4ba95df3940789ca3ddfdb54', 'Los Matadores', 'team', (select id from teams where slug = 'los-matadores')),
('dutchmen', 'c23816c821e8c22159ff05a08ff572a7:3e4cef539e797ceff9d41495c30ecc973ff60373feb4405f1ab84766ade7fceda51b722459af43d1c438c276b8360fb2d044a245e82cd0e3f44cabea135eda02', 'Flying Dutchmen', 'team', (select id from teams where slug = 'flying-dutchmen')),
('battalion', '36388d41db6aba3c7a08dc201abe8a37:1488c3a0a8a664fea0903f176258fb55769261460b98f6cbc1ca626f36375ac600d7f90af55abe22ce0e2cec0429db0df2c149cc3b9b9aa10c18b79396d2e9d4', 'Baguette Battalion', 'team', (select id from teams where slug = 'baguette-battalion')),
('thewurst', 'd676f40735c0c2585c3fe4f6ac7a4d58:9ee30ac1893871cd1c5a9b13875b799d2695970b5cd54418c985d40d8c0c35a527e55e0bccc4c56610db765d731d0a55a97a4b9af27712b5d0b20ab998261ed8', 'The Wurst Case Scenario', 'team', (select id from teams where slug = 'the-wurst-case-scenario')),
('iniestagram', '8dcd14510b05e0d8987ab2772bab9981:017245eea092296ca046d6d7e6b80b8502b67eee198e3499b00aec08f612b3b165d7dd057b2168881c335d10d6e1e6fcc546c5f2ff69960bc38d1de06a4f3e32', 'Iniestagram Influencers', 'team', (select id from teams where slug = 'iniestagram-influencers')),
('inazumaeleven', 'dbb05717037f9abefaaff6622d618b49:9e8f1d807ee613d1cf7831f0fdb49362f57a9fc39245bbb07eedc2754ca94567eb486c6691f11933174f3fafd94ba450cc9f5bf3a856167041caf6b74fba82b2', 'Inazuma Eleven', 'team', (select id from teams where slug = 'inazuma-eleven')),
('thecolonizersfc', '70799d761ae10eba9c4afe5f142dd134:c2b0c2a1017960cd9bd8be833cb2d99b229acee18a5b30c46c0d7098d0370641ec43a69af7011cd6a306e488f747d27e60ce182baeb787fa211f7edba3dad06d', 'The Colonizers FC', 'team', (select id from teams where slug = 'the-colonizers-fc')),
('hazardousxi', 'd5f58f7df3931e46ce2c4df67ebf14e2:9abde059dae3089a5a1b3e5520f6046430f000caf4a86a8ac7ad5c30b7568b9978b30eddf18e978f1cde5dee1af36f415bff5f4c11df0cbdda5fa4f272409900', 'Hazardous XI', 'team', (select id from teams where slug = 'hazardous-xi')),
('caicaifc', '5064d965331aab44f873604767ffd308:dbf5929b512f8fa42b6c909d0f1136a79f4edad500dd0d0d9f3667cf2dc59d788ca9748f244bf067a57bdc6d511cdba07c7fb701112dac5ecf870bc7c0a9b51d', 'Cai Cai FC', 'team', (select id from teams where slug = 'cai-cai-fc')),
('m10', 'a07c32f2b6fc32fb11f6dc47080fa92b:ade249ebdc11a28bdf9f52d7a63e398db6c8c8c8c5fe0b61d0683703b7d3ff0e726816db219059eb25202543dacf81388049d5672087f274752a7344e7840fad', 'M10', 'team', (select id from teams where slug = 'm10')),
('siuuperstars', 'a21f36ec0961075feb62f89da7c2f7cb:d7545a1dc3ea7710b98cd29afea1e8fa303dcf78f4eaa5d05b87da55b9efdc2f637fa0406fb7fb1694d4899113eb970bb2a61a3597f1bb283ebdcd1c85ae34e2', 'Siuuperstars', 'team', (select id from teams where slug = 'siuuperstars'))
on conflict (username) do nothing;

insert into storage.buckets (id, name, public)
values ('player-cards', 'player-cards', true)
on conflict (id) do nothing;

create policy "Public can read player cards" on storage.objects
for select using (bucket_id = 'player-cards');

create policy "Admin can upload player cards" on storage.objects
for insert with check (bucket_id = 'player-cards');

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
create index if not exists idx_bids_room on bids(room_id, created_at desc);
create index if not exists idx_bids_room_player on bids(room_id, player_id, created_at desc);
create index if not exists idx_purchases_room on purchases(room_id, created_at desc);
create index if not exists idx_purchases_team on purchases(team_id);
create index if not exists idx_participants_room on auction_participants(room_id);

-- alter table players drop column category;
-- drop type if exists player_category_t;
