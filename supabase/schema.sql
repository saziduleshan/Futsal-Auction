create extension if not exists pgcrypto;

create type division_t as enum ('men', 'women');
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
('Siuperstars', 'siuperstars', 'men', 1000, '#9b5cff'),
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
('losmatadores', 'ba889fd76a745e3572660309eb627b8c:633b231e5e798e5938852be139e533a54bc50eb7d08fc008fba062d7613a6afc07c5d6a4f818859a46d5496fa77da1da464a1b5c4ba95df3940789ca3ddfdb54', 'Los Matadores', 'team', (select id from teams where slug = 'los-matadores')),
('flyingdutchmen', '1014217b2937fca6054e392846a10f98:f14f6dd64589958ff631654c5849f2ac1daa50a8db5d16564bc5a706f0d4582049fc0c899ed24b38250066187d4c9c8b1d57e514fb6a656656427aed0808dea2', 'Flying Dutchmen', 'team', (select id from teams where slug = 'flying-dutchmen')),
('baguettebattalion', 'a25b3c69f34a69958c381415df79d58e:1d75ea191759dc79f8b6c4ef817f336e2731b37c74a175c6bb76aab495dc753d10515be90a8fb72415aa305972661198cc344e229341841f770cfd3ae434731c', 'Baguette Battalion', 'team', (select id from teams where slug = 'baguette-battalion')),
('thewurstcasescenario', '8489b70ee325ea47579086d6ca83491f:bcf2f67ad5260078a1d583e77857f915afd7a3deaafde57f29952c0166c93a33a7bc526f53fd488df5fd5e97d8927de24b0ddc15478933d8c85f285035be6390', 'The Wurst Case Scenario', 'team', (select id from teams where slug = 'the-wurst-case-scenario')),
('m10', 'b8a49a702c00f10000c758c815ca3d40:f0a287d80ef01a505a432ab704132129f9a93bc6b07db09f526671b8e37b9561597a3cc55bb88688c52c235fd2eadd6ed5e1de00277c5abc471babd49888db58', 'M10', 'team', (select id from teams where slug = 'm10')),
('caicaifc', '331132b19793ab8c0d1ca78045a98416:b64f9f51504151661146e3ce340e6939b8e429cbc27a6e999d2ef5a772fc4f7c9f9a12a9a255dbfce50dbe17b4ee6834f0d518d6cfbb58c0d7810c4e1463c20b', 'Cai Cai FC', 'team', (select id from teams where slug = 'cai-cai-fc')),
('siuperstars', '892982a89d0bfd6b1d7863d343039be4:adfef80fb7ac9d1bf9fc6f54357a4e24f9caf2193be15d4bfb578349c3af02eb99dc4d8a355fbd8631882164f05860f675bff630882faea30ee60780e8d0f20f', 'Siuperstars', 'team', (select id from teams where slug = 'siuperstars')),
('iniestagraminfluencers', '600ec9a1c0c6b8e5a2641b4f821cc157:b5abe49b93404c498adf72cb6c0c5fa4cf177216924c31db003ca20dc15f8ce6a45db3349391a5f86deef44316bfa67f27f81ffae70c42418acbeb7cf8f942f3', 'Iniestagram Influencers', 'team', (select id from teams where slug = 'iniestagram-influencers')),
('inazumaeleven', 'dbb05717037f9abefaaff6622d618b49:9e8f1d807ee613d1cf7831f0fdb49362f57a9fc39245bbb07eedc2754ca94567eb486c6691f11933174f3fafd94ba450cc9f5bf3a856167041caf6b74fba82b2', 'Inazuma Eleven', 'team', (select id from teams where slug = 'inazuma-eleven')),
('thecolonizersfc', '70799d761ae10eba9c4afe5f142dd134:c2b0c2a1017960cd9bd8be833cb2d99b229acee18a5b30c46c0d7098d0370641ec43a69af7011cd6a306e488f747d27e60ce182baeb787fa211f7edba3dad06d', 'The Colonizers FC', 'team', (select id from teams where slug = 'the-colonizers-fc')),
('hazardousxi', 'd5f58f7df3931e46ce2c4df67ebf14e2:9abde059dae3089a5a1b3e5520f6046430f000caf4a86a8ac7ad5b30c7568b9978b30eddf18e978f1cde5dee1af36f415bff5f4c11df0cbdda5fa4f272409900', 'Hazardous XI', 'team', (select id from teams where slug = 'hazardous-xi'))
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

-- ═══════════════════════════════════════════════
-- MIGRATION: remove category column (run if upgrading)
-- ═══════════════════════════════════════════════
-- alter table players drop column category;
-- drop type if exists player_category_t;
