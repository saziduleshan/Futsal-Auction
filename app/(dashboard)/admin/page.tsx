import { requireAdmin } from '@/lib/auth';
import { getAdminPageData } from '@/lib/data';
import { AdminAuctionPanel } from '@/components/admin/admin-auction-panel';
import { PlayerForm } from '@/components/admin/player-form';
import { currency } from '@/lib/utils';

export default async function AdminPage() {
  await requireAdmin();
  const { teams, players, rooms } = await getAdminPageData();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 md:py-12">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PlayerForm />
        <div className="panel p-8">
          <p className="badge">Tournament snapshot</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em]">Teams and purse</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold uppercase tracking-[0.08em]">{team.name}</p>
                <p className="mt-2 text-sm text-white/60">{team.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</p>
                <p className="mt-3 text-xl font-black text-lime">{currency(team.purse)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
            Total players in pool: <span className="font-bold text-white">{players.length}</span>
          </div>
        </div>
      </div>
      <AdminAuctionPanel rooms={rooms} players={players} teams={teams} />
    </div>
  );
}
