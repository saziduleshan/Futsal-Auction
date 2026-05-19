import { createServerSupabase } from '@/lib/supabase/server';
import type { AuctionRoom, Bid, Division, Player, Team } from '@/lib/types';

export async function getCurrentUser(userId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, display_name, team_id')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getRoomBundle(division: Division) {
  const supabase = createServerSupabase();

  const [{ data: room, error: roomError }, { data: teams, error: teamsError }] = await Promise.all([
    supabase
      .from('auction_rooms')
      .select('id, division, current_player_id, current_bid, current_highest_team_id, bid_increment, status, nominated_at')
      .eq('division', division)
      .single<AuctionRoom>(),
    supabase
      .from('teams')
      .select('id, name, slug, division, purse, accent_color')
      .eq('division', division)
      .order('name')
      .returns<Team[]>()
  ]);

  if (roomError) throw roomError;
  if (teamsError) throw teamsError;

  let currentPlayer: Player | null = null;
  if (room.current_player_id) {
    const { data, error } = await supabase
      .from('players')
       .select('id, name, division, category, year, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
      .eq('id', room.current_player_id)
      .single<Player>();

    if (error) throw error;
    currentPlayer = data;
  }

  let bidsQuery = supabase
    .from('bids')
    .select('id, room_id, player_id, team_id, amount, created_at')
    .eq('room_id', room.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (room.current_player_id) {
    bidsQuery = bidsQuery.eq('player_id', room.current_player_id);
  }

  const { data: recentBids, error: bidsError } = await bidsQuery.returns<Bid[]>();

  if (bidsError) throw bidsError;

  return {
    room,
    teams,
    currentPlayer,
    recentBids: recentBids ?? []
  };
}

export async function getTeamBundleBySlug(slug: string) {
  const supabase = createServerSupabase();
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, name, slug, division, purse, accent_color')
    .eq('slug', slug)
    .single<Team>();

  if (teamError) throw teamError;

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, name, division, category, year, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
    .eq('sold_to_team_id', team.id)
    .order('category')
    .order('name')
    .returns<Player[]>();

  if (playersError) throw playersError;

  return {
    team,
    players: players ?? []
  };
}

export async function getPlayers() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('players')
    .select('id, name, division, category, year, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
    .order('created_at', { ascending: false })
    .returns<Player[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getAdminPageData() {
  const supabase = createServerSupabase();
  const [{ data: teams, error: teamsError }, { data: players, error: playersError }, { data: rooms, error: roomsError }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, slug, division, purse, accent_color')
      .order('division')
      .order('name')
      .returns<Team[]>(),
    supabase
      .from('players')
      .select('id, name, division, category, year, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
      .order('created_at', { ascending: false })
      .returns<Player[]>(),
    supabase
      .from('auction_rooms')
      .select('id, division, current_player_id, current_bid, current_highest_team_id, bid_increment, status, nominated_at')
      .order('division')
      .returns<AuctionRoom[]>()
  ]);

  if (teamsError) throw teamsError;
  if (playersError) throw playersError;
  if (roomsError) throw roomsError;

  return {
    teams: teams ?? [],
    players: players ?? [],
    rooms: rooms ?? []
  };
}
