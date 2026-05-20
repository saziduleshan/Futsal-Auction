import { requireAdmin } from '@/lib/auth';
import { getAdminPageData } from '@/lib/data';
import { AuctionSetupForm } from '@/components/admin/auction-setup-form';

export default async function AuctionSetupPage() {
  await requireAdmin();
  const { teams } = await getAdminPageData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
      <AuctionSetupForm teams={teams} />
    </div>
  );
}
