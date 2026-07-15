import { db } from '@/lib/data';
import { CollegesExplorer } from '@/components/colleges/CollegesExplorer';

export default async function CollegesPage() {
  const [colleges, cities, teamMembers, streams, contacts, competitors] = await Promise.all([
    db.listColleges(),
    db.listCities(),
    db.listTeamMembers(),
    db.listStreams(),
    db.listContacts(),
    db.listCompetitors(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Colleges</h1>
        <p className="mt-1 text-sm text-slate-500">
          {colleges.length} college{colleges.length === 1 ? '' : 's'} mapped. Expand a row to
          see its streams.
        </p>
      </div>

      <CollegesExplorer
        colleges={colleges}
        cities={cities}
        teamMembers={teamMembers}
        streams={streams}
        contacts={contacts}
        competitors={competitors}
      />
    </div>
  );
}
