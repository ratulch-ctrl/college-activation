import { db } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth/session';
import { StageBadge } from '@/components/StageBadge';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function FollowUpsPage() {
  const user = await getCurrentUser();
  const today = todayIso();
  const followUps = user ? await db.followUpsDue(user.id, today) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My follow-ups due</h1>
        <p className="mt-1 text-sm text-slate-500">
          Active streams you own with a next-action date on or before {today}.
        </p>
      </div>

      {followUps.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Nothing due right now.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {followUps.map((s) => {
            const overdue = s.next_action_date != null && s.next_action_date < today;
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {s.college_name} — {s.stream_name}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {s.current_next_step ?? 'No next step set'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`text-xs font-medium ${overdue ? 'text-rose-600' : 'text-slate-500'}`}
                  >
                    {overdue ? 'Overdue · ' : ''}
                    {s.next_action_date}
                  </span>
                  <StageBadge stage={s.stage} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
