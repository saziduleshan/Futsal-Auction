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

create type player_year_t as enum ('1', '2', '3', '4', 'final');

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  division division_t not null,
  category player_category_t not null,
  year player_year_t not null default '1',
  base_price integer not null,
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
('team-men-1', '0d6d869130a6a96f06ad679df0f251d3:f862e96efb896a8746f33cc87871f565c4c66fdc354c5547b2c2462ba38e630ec82eb55267aafed3bbfce0ff1746d7357dba9fcaae1be57f8a1d5420278296ee', 'Men Team 1 Manager', 'team', (select id from teams where slug = 'men-team-1')),
('team-men-2', '2b8a5d2c844613803226deb6e413368b:239d9c99ef38dc9e00d561aba58c4e5f7c272bf8bc9dd4a349e44d38b2400a9fae7fd516a4b02428814b765f3cee5c39ea92663294b04aab53f54e0e532cae91', 'Men Team 2 Manager', 'team', (select id from teams where slug = 'men-team-2')),
('team-men-3', 'c5a1133636ce20f5fccb231a4a8022f6:c3675183478e25e29749a1160d874f181ec0f01d447931d509711122a753cd48996f87f6326f1e6d76b7507cba72f7511aee8623d42f9658fcc5d10714ddbcd5', 'Men Team 3 Manager', 'team', (select id from teams where slug = 'men-team-3')),
('team-men-4', '23bdb2c87cf3ba5ac3e8c930e7b54cca:68e7c2fe5700081c4da8833a47f645abca04e404e9c188e7cb3fae0f69e477810ea8660f6ffa0b4107455a1d0f888003ab83494ba321138ba984769be6dce12a', 'Men Team 4 Manager', 'team', (select id from teams where slug = 'men-team-4')),
('team-men-5', '565150268706be71264e100663f4e54b:118e41ffe75da8236f49456dac0e3a7a9c07a9ffd0850119783d040a932ab75df37b5e70d7364f8590d95a0f26cb922c4cb9aea5df2ee4f6d44dce0eff8e92c3', 'Men Team 5 Manager', 'team', (select id from teams where slug = 'men-team-5')),
('team-men-6', '9fd2eee456bb4ae6e3265c74f2e13006:e7418e78639c10fbd295ac93b18d150f1cbd27daf7e4501d152c02a2094f883f0617eede22d5b96dcf20e169891cd61c118f42309110415acbac19dca2d0eaa2', 'Men Team 6 Manager', 'team', (select id from teams where slug = 'men-team-6')),
('team-men-7', '41be094307234d91cc0bfa31805d6347:0b5d13130f7ca2f60a173e36cfd837db99a5b3294ebc64dc7ec0133f6b3354506317a7f12561d0ca52c3fc1b45ca970ef2e739bdcf1c95e62253f762859fefab', 'Men Team 7 Manager', 'team', (select id from teams where slug = 'men-team-7')),
('team-men-8', '7264a0b14c3325d57344450303e1ec63:d7b762a952ea71f464d1c286e587a3650f5ca4c140641b217c3e81f46cc14012289bc8d5e75691e773ab7f7869b38b4bcf145bd5d3dbceaf12c38e3e7675ab9b', 'Men Team 8 Manager', 'team', (select id from teams where slug = 'men-team-8')),
('team-women-1', '7547177f62357ee9632a9ada1ea6f4cc:7ba1cc8a4f01f65fd51f8c5ab9b3952405613af6ce9f15c44bbdae787ca94e7ea19201cc5e07c3764229a190c8de34b947da7b0b3ff1d65778b5f62defb97490', 'Women Team 1 Manager', 'team', (select id from teams where slug = 'women-team-1')),
('team-women-2', '5f59918abfe9394d2fc8d06293a48487:94d6332de1daaed3b223e17396afe3504f680634a08d03fd7cd31ab9838b0cc236cb7de6ba07eed6b2d9abb464681edb77deb1400a8b2e3f3386033b40211bca', 'Women Team 2 Manager', 'team', (select id from teams where slug = 'women-team-2')),
('team-women-3', '4e77f7bf383da8606a08513bf13e83a3:1a2d33bf26b49de284ad0bd8b127a4caa48fea0a5e27cc7260e32c2dc5f4c9ac633a01b4b17cb2e966908cda637e2ddbeb52e9882fd6b85fa8a23e9061984469', 'Women Team 3 Manager', 'team', (select id from teams where slug = 'women-team-3'))
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

-- ═══════════════════════════════════════════════
-- MIGRATION: add year column (run if upgrading)
-- ═══════════════════════════════════════════════
-- Run this separately if the players table already exists:
--
--   create type player_year_t as enum ('1', '2', '3', '4', 'final');
--   alter table players add column year player_year_t not null default '1';
