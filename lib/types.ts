export type Division = 'men' | 'women';
export type AuctionStatus = 'idle' | 'live' | 'sold' | 'unsold';
export type UserRole = 'admin' | 'moderator' | 'team';

export interface Team {
  id: string;
  name: string;
  slug: string;
  division: Division;
  purse: number;
  accent_color: string | null;
}

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  display_name: string;
  team_id: string | null;
}

export interface Player {
  id: string;
  name: string;
  division: Division;
  base_price: number;
  status: 'available' | 'sold' | 'unsold';
  card_image_url: string | null;
  sold_price: number | null;
  sold_to_team_id: string | null;
  created_at: string;
}

export interface AuctionRoom {
  id: string;
  division: Division;
  current_player_id: string | null;
  current_bid: number;
  current_highest_team_id: string | null;
  bid_increment: number;
  status: AuctionStatus;
  nominated_at: string | null;
  join_code: string | null;
  ended_at: string | null;
}

export interface Bid {
  id: string;
  room_id: string;
  player_id: string;
  team_id: string;
  amount: number;
  created_at: string;
}

export interface AuctionParticipant {
  id: string;
  room_id: string;
  team_id: string;
  joined_at: string;
}

export interface Purchase {
  id: string;
  room_id: string;
  player_id: string;
  team_id: string;
  price: number;
  created_at: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  teamId?: string | null;
  exp: number;
}
