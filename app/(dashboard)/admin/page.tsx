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
          <div className="panel overflow-hidden p-8">
          <p className="badge">Tournament snapshot</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.12em]">Teams and purse</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/[0.06] to-transparent p-4 transition hover:border-cyan/40">
                <p className="font-bold uppercase tracking-[0.08em]">{team.name}</p>
                <p className={`mt-2 text-sm ${team.division === 'men' ? 'text-cyan' : 'text-magenta'}`}>{team.division === 'men' ? 'Male Futsal' : 'Female Futsal'}</p>
                <p className="mt-3 text-xl font-black text-gold">{currency(team.purse)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-purple/20 bg-gradient-to-br from-purple/[0.06] to-transparent p-4 text-sm text-gray-500">
            Total players in pool: <span className="font-bold text-purple">{players.length}</span>
          </div>
        </div>
      </div>
      <AdminAuctionPanel rooms={rooms} players={players} teams={teams} />
    </div>
  );
}
