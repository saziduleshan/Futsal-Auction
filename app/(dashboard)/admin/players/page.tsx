import { requireAdmin } from '@/lib/auth';
import { getPlayers } from '@/lib/data';
import { PlayerDatabase } from '@/components/admin/player-database';

export default async function PlayersPage() {
  await requireAdmin();
  const players = await getPlayers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
      <PlayerDatabase players={players} />
    </div>
  );
}
