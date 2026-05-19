import { requireAdmin } from '@/lib/auth';
import { getPlayers } from '@/lib/data';
import { PlayerDatabase } from '@/components/admin/player-database';

export default async function PlayersPage() {
  await requireAdmin();
  const players = await getPlayers();

  return (
    <>
      <div className="fixed inset-0 z-[-1] bg-cover bg-center" style={{ backgroundImage: "url('/Player Database.jpg')" }} />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <PlayerDatabase players={players} />
      </div>
    </>
  );
}
