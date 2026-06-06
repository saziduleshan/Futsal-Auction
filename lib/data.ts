import { createServerSupabase } from '@/lib/supabase/server';
import type { AuctionParticipant, AuctionRoom, Bid, Division, Player, Purchase, Team } from '@/lib/types';

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
      .select('id, division, current_player_id, current_bid, current_highest_team_id, bid_increment, status, nominated_at, join_code, ended_at')
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
       .select('id, name, division, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
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

  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, room_id, player_id, team_id, price, created_at')
    .eq('team_id', team.id);

  let playerIds: string[] = [];
  if (purchases && purchases.length > 0) {
    playerIds = purchases.map((p) => p.player_id);
  }

  const { data: legacyPlayers } = await supabase
    .from('players')
    .select('id, name, division, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
    .eq('sold_to_team_id', team.id);

  if (legacyPlayers && legacyPlayers.length > 0) {
    for (const p of legacyPlayers) {
      if (!playerIds.includes(p.id)) {
        playerIds.push(p.id);
      }
    }
  }

  let players: Player[] = [];
  if (playerIds.length > 0) {
    const { data, error: playersError } = await supabase
      .from('players')
      .select('id, name, division, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
      .in('id', playerIds)
      .order('name')
      .returns<Player[]>();

    if (playersError) throw playersError;
    players = data ?? [];
  }

  return {
    team,
    players,
    purchases: purchases ?? []
  };
}

export async function getTeamJoinedRooms(teamId: string): Promise<string[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('auction_participants')
    .select('room_id')
    .eq('team_id', teamId);

  return (data ?? []).map((r) => r.room_id);
}

export async function getRoomJoinCode(division: Division): Promise<string | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('auction_rooms')
    .select('join_code')
    .eq('division', division)
    .single<{ join_code: string | null }>();

  return data?.join_code ?? null;
}

export async function getPlayers() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('players')
    .select('id, name, division, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
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
      .select('id, name, division, base_price, status, card_image_url, sold_price, sold_to_team_id, created_at')
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
