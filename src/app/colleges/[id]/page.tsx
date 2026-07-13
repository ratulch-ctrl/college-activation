import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/data';
import { humanize } from '@/lib/types';
import { StageBadge } from '@/components/StageBadge';

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collegeId = Number(id);
  const college = Number.isFinite(collegeId) ? await db.getCollege(collegeId) : null;
  if (!college) notFound();

  const [cities, members, streams, contacts] = await Promise.all([
    db.listCities(),
    db.listTeamMembers(),
    db.listStreams(college.id),
    db.listContacts(college.id),
  ]);

  const cityName = cities.find((c) => c.id === college.city_id)?.name ?? '—';
  const memberName = (mid: number | null) =>
    mid == null ? '—' : (members.find((m) => m.id === mid)?.name ?? '—');

  return (
    <div className="space-y-8">
      <div>
        <Link href="/colleges" className="text-sm text-sky-700 hover:underline">
          ← Colleges
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{college.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {cityName} · {humanize(college.category)} · {humanize(college.engagement_scope)} ·
          Owner: {memberName(college.owner_bdm_id)}
        </p>
        {college.notes && <p className="mt-2 text-sm text-slate-600">{college.notes}</p>}
      </div>

      {/* Streams */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700">Streams</h2>
        {streams.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No streams yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {streams.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">{s.stream_name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {s.department ? `${s.department} · ` : ''}
                    Final-year strength: {s.final_year_strength ?? '—'} · Owner:{' '}
                    {memberName(s.owner_bdm_id)}
                  </div>
                  {s.current_next_step && (
                    <div className="mt-1 text-xs text-slate-500">
                      Next: {s.current_next_step}
                      {s.next_action_date ? ` (by ${s.next_action_date})` : ''}
                    </div>
                  )}
                </div>
                <StageBadge stage={s.stage} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contacts */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700">Contacts</h2>
        {contacts.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No contacts yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {contacts.map((ct) => (
              <li key={ct.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {ct.name}
                    {ct.is_primary && (
                      <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {humanize(ct.role)}
                    {ct.department ? ` · ${ct.department}` : ''}
                    {ct.phone ? ` · ${ct.phone}` : ''}
                    {ct.email ? ` · ${ct.email}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Read-only preview. Editing colleges, streams, and contacts arrives in the next pull
        request.
      </p>
    </div>
  );
}
