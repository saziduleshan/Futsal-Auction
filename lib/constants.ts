export const DIVISIONS = [
  { value: 'men', label: 'Male Futsal', teamCount: 8 },
  { value: 'women', label: 'Female Futsal', teamCount: 3 }
] as const;

export const PLAYER_CATEGORIES = [
  'defender',
  'midfielder',
  'forward',
  'goalkeeper'
] as const;

export const AUCTION_STATUSES = ['idle', 'live', 'sold', 'unsold'] as const;
export const USER_ROLES = ['admin', 'team'] as const;

export const YEAR_TIERS = [
  { value: 1 as const, label: 'Year 1', tier: 'Rising stars', basePrice: 50 },
  { value: 2 as const, label: 'Year 2', tier: 'Ballers', basePrice: 100 },
  { value: 3 as const, label: 'Year 3', tier: 'Maestros', basePrice: 150 },
  { value: 4 as const, label: 'Year 4', tier: 'Titans', basePrice: 200 },
  { value: 'final' as const, label: 'Final Year', tier: 'Icons', basePrice: 250 }
] as const;

export function getYearTier(year: number | 'final') {
  return YEAR_TIERS.find((yt) => yt.value === year)!;
}
