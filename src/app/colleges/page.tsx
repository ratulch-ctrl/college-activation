import Link from 'next/link';
import { db } from '@/lib/data';
import { humanize } from '@/lib/types';

export default async function CollegesPage() {
  const [colleges, cities, streams] = await Promise.all([
    db.listColleges(),
    db.listCities(),
    db.listStreams(),
  ]);

  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? '—';
  const streamCount = (collegeId: number) =>
    streams.filter((s) => s.college_id === collegeId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Colleges</h1>
          <p className="mt-1 text-sm text-slate-500">
            {colleges.length} college{colleges.length === 1 ? '' : 's'} mapped.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3 text-right">Streams</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {colleges.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/colleges/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                  {c.is_paid_partner && (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                      Paid partner
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{cityName(c.city_id)}</td>
                <td className="px-4 py-3 text-slate-600">{humanize(c.category)}</td>
                <td className="px-4 py-3 text-slate-600">{humanize(c.engagement_scope)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{streamCount(c.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Read-only preview. Create / edit and the college detail view (streams + contacts)
        arrive in the next pull request.
      </p>
    </div>
  );
}
