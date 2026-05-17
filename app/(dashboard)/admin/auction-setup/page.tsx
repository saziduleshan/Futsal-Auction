import { requireAdmin } from '@/lib/auth';
import { getAdminPageData } from '@/lib/data';
import { AuctionSetupForm } from '@/components/admin/auction-setup-form';
import { AdminAuctionPanel } from '@/components/admin/admin-auction-panel';

export default async function AuctionSetupPage() {
  await requireAdmin();
  const { teams, players, rooms } = await getAdminPageData();

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-12">
      <AuctionSetupForm />
      {rooms.length > 0 && (
        <AdminAuctionPanel rooms={rooms} players={players} teams={teams} />
      )}
    </div>
  );
}
