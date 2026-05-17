import { requireAdmin } from '@/lib/auth';
import { getAdminPageData } from '@/lib/data';
import { AdminAuctionPanel } from '@/components/admin/admin-auction-panel';
import { PlayerForm } from '@/components/admin/player-form';
import { PlayerDatabase } from '@/components/admin/player-database';

export default async function AdminPage() {
  await requireAdmin();
  const { teams, players, rooms } = await getAdminPageData();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-12">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PlayerForm />
        <PlayerDatabase players={players} />
      </div>
      <AdminAuctionPanel rooms={rooms} players={players} teams={teams} />
    </div>
  );
}
