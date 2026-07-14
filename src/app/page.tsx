import Link from 'next/link';
import { db } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth/session';
import { PIPELINE_STAGES, humanize } from '@/lib/types';
import { StageBadge } from '@/components/StageBadge';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [colleges, streams] = await Promise.all([
    db.listColleges(),
    db.listStreamsWithContext(),
  ]);

  const activeStreams = streams.filter((s) => s.is_active);
  const byStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: streams.filter((s) => s.stage === stage).length,
  }));

  const followUps = user ? await db.followUpsDue(user.id, todayIso()) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {user ? `Hi, ${user.name}` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          College mapping and daily logging at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Colleges" value={colleges.length} href="/colleges" />
        <StatCard label="Active streams" value={activeStreams.length} href="/board" />
        <StatCard
          label="Confirmed"
          value={streams.filter((s) => s.stage === 'CONFIRMED').length}
          href="/board"
        />
        <StatCard label="My follow-ups due" value={followUps.length} href="/follow-ups" />
      </div>

      {/* Pipeline snapshot */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700">Pipeline snapshot</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {byStage.map(({ stage, count }) => (
            <div key={stage} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-2xl font-semibold text-slate-900">{count}</div>
              <div className="mt-1 text-xs text-slate-500">{humanize(stage)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* My follow-ups due */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">My follow-ups due</h2>
          <Link href="/follow-ups" className="text-sm font-medium text-sky-700 hover:underline">
            View all
          </Link>
        </div>
        {followUps.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nothing due. 🎉
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {followUps.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {s.college_name} — {s.stream_name}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {s.current_next_step ?? 'No next step set'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-slate-500">{s.next_action_date}</span>
                  <StageBadge stage={s.stage} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </Link>
  );
}
