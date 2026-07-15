'use client';

import { useMemo, useState } from 'react';
import {
  humanize,
  PIPELINE_STAGES,
  type City,
  type College,
  type CollegeCompetitor,
  type CollegeContact,
  type CollegeStream,
  type InternalPriorityTier,
  type StreamStage,
  type TeamMember,
} from '@/lib/types';
import { calculatedStageForCollege, totalStudentsForCollege } from '@/lib/collegeRollup';
import { StageBadge } from '@/components/StageBadge';
import { PriorityTierBadge } from '@/components/colleges/PriorityTierBadge';
import { AddCollegeModal } from '@/components/colleges/AddCollegeModal';
import { EditCollegeModal } from '@/components/colleges/EditCollegeModal';
import { AddStreamModal } from '@/components/colleges/AddStreamModal';

const TIER_ORDER: Record<InternalPriorityTier, number> = { A: 0, B: 1, C: 2 };

function compareTier(
  a: InternalPriorityTier | null,
  b: InternalPriorityTier | null,
  dir: 'asc' | 'desc',
): number {
  const av = a ? TIER_ORDER[a] : Infinity;
  const bv = b ? TIER_ORDER[b] : Infinity;
  if (av === Infinity && bv === Infinity) return 0;
  if (av === Infinity) return 1;
  if (bv === Infinity) return -1;
  return dir === 'asc' ? av - bv : bv - av;
}

function compareStage(a: StreamStage | null, b: StreamStage | null, dir: 'asc' | 'desc'): number {
  const av = a ? PIPELINE_STAGES.indexOf(a) : Infinity;
  const bv = b ? PIPELINE_STAGES.indexOf(b) : Infinity;
  if (av === Infinity && bv === Infinity) return 0;
  if (av === Infinity) return 1;
  if (bv === Infinity) return -1;
  return dir === 'asc' ? av - bv : bv - av;
}

type SortKey = 'tier' | 'stage';
type SortState = { key: SortKey; dir: 'asc' | 'desc' } | null;

export function CollegesExplorer({
  colleges,
  cities,
  teamMembers,
  streams,
  contacts,
  competitors,
}: {
  colleges: College[];
  cities: City[];
  teamMembers: TeamMember[];
  streams: CollegeStream[];
  contacts: CollegeContact[];
  competitors: CollegeCompetitor[];
}) {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'crisp' | 'detailed'>('crisp');
  const [sort, setSort] = useState<SortState>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [addingStreamFor, setAddingStreamFor] = useState<College | null>(null);

  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? '—';
  const memberName = (id: number | null) =>
    id == null ? '—' : (teamMembers.find((m) => m.id === id)?.name ?? '—');

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  }

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? colleges.filter((c) => c.name.toLowerCase().includes(q)) : colleges;
    const list = [...filtered];
    if (sort) {
      list.sort((a, b) => {
        if (sort.key === 'tier') {
          return compareTier(a.internal_priority_tier, b.internal_priority_tier, sort.dir);
        }
        return compareStage(
          calculatedStageForCollege(streams, a.id),
          calculatedStageForCollege(streams, b.id),
          sort.dir,
        );
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [colleges, query, sort, streams]);

  const detailed = viewMode === 'detailed';
  const colCount = 8 + (detailed ? 4 : 0); // expand + name + city + owner + tier + maps + stage + total (+detailed 4) + actions handled separately below

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search college name…"
          className="input max-w-xs"
        />

        <div className="flex rounded-md border border-slate-200 bg-white p-0.5 text-sm">
          {(['crisp', 'detailed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded px-3 py-1 font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAddCollegeOpen(true)}
          className="ml-auto rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add college
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Owner BDM</th>
              <SortableHeader label="Priority tier" active={sort?.key === 'tier'} dir={sort?.dir} onClick={() => toggleSort('tier')} />
              <th className="px-4 py-3">Maps</th>
              <SortableHeader label="Stage" active={sort?.key === 'stage'} dir={sort?.dir} onClick={() => toggleSort('stage')} />
              <th className="px-4 py-3 text-right">Total intake</th>
              {detailed && (
                <>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Affiliation</th>
                  <th className="px-4 py-3">Accreditation</th>
                  <th className="px-4 py-3">Competitor intel</th>
                </>
              )}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((c) => {
              const isOpen = expanded.has(c.id);
              const calcStage = calculatedStageForCollege(streams, c.id);
              const totalStudents = totalStudentsForCollege(streams, c.id);
              const collegeCompetitors = competitors.filter((cp) => cp.college_id === c.id);

              return (
                <ExpandableRow
                  key={c.id}
                  isOpen={isOpen}
                  colCount={colCount + 1}
                  onToggle={() => toggleExpanded(c.id)}
                  college={c}
                  cityName={cityName(c.city_id)}
                  ownerName={memberName(c.owner_bdm_id)}
                  calcStage={calcStage}
                  totalStudents={totalStudents}
                  detailed={detailed}
                  competitors={collegeCompetitors}
                  onEdit={() => setEditingCollege(c)}
                >
                  <StreamsSubTable
                    college={c}
                    streams={streams.filter((s) => s.college_id === c.id)}
                    contacts={contacts}
                    onAddStream={() => setAddingStreamFor(c)}
                  />
                </ExpandableRow>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={colCount + 1} className="px-4 py-10 text-center text-slate-400">
                  No colleges match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addCollegeOpen && (
        <AddCollegeModal cities={cities} onClose={() => setAddCollegeOpen(false)} />
      )}
      {editingCollege && (
        <EditCollegeModal
          college={editingCollege}
          cities={cities}
          teamMembers={teamMembers}
          competitors={competitors.filter((cp) => cp.college_id === editingCollege.id)}
          onClose={() => setEditingCollege(null)}
        />
      )}
      {addingStreamFor && (
        <AddStreamModal
          collegeId={addingStreamFor.id}
          collegeName={addingStreamFor.name}
          onClose={() => setAddingStreamFor(null)}
        />
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active?: boolean;
  dir?: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        onClick={onClick}
        className={`flex items-center gap-1 font-semibold uppercase tracking-wide ${
          active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {label}
        <span className="text-[10px]">{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}

function ExpandableRow({
  isOpen,
  colCount,
  onToggle,
  college,
  cityName,
  ownerName,
  calcStage,
  totalStudents,
  detailed,
  competitors,
  onEdit,
  children,
}: {
  isOpen: boolean;
  colCount: number;
  onToggle: () => void;
  college: College;
  cityName: string;
  ownerName: string;
  calcStage: StreamStage | null;
  totalStudents: number;
  detailed: boolean;
  competitors: CollegeCompetitor[];
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-2 py-3">
          <button
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse streams' : 'Expand streams'}
            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            {isOpen ? '▾' : '▸'}
          </button>
        </td>
        <td className="px-4 py-3 font-medium text-slate-900">{college.name}</td>
        <td className="px-4 py-3 text-slate-600">{cityName}</td>
        <td className="px-4 py-3 text-slate-600">{ownerName}</td>
        <td className="px-4 py-3">
          <PriorityTierBadge tier={college.internal_priority_tier} />
        </td>
        <td className="px-4 py-3">
          {college.google_maps_link ? (
            <a
              href={college.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 hover:underline"
            >
              Map ↗
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {calcStage ? <StageBadge stage={calcStage} /> : <span className="text-slate-400">—</span>}
        </td>
        <td className="px-4 py-3 text-right text-slate-600">{totalStudents}</td>
        {detailed && (
          <>
            <td className="px-4 py-3 text-slate-600">{humanize(college.category)}</td>
            <td className="px-4 py-3 text-slate-600">{college.affiliation || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{college.accreditation || '—'}</td>
            <td className="max-w-[16rem] truncate px-4 py-3 text-slate-600" title={competitors
              .map((cp) => `${cp.competitor_name}${cp.strength ? ` (${humanize(cp.strength)})` : ''}`)
              .join(', ')}
            >
              {competitors.length === 0
                ? '—'
                : competitors
                    .map((cp) => `${cp.competitor_name}${cp.strength ? ` (${humanize(cp.strength)})` : ''}`)
                    .join(', ')}
            </td>
          </>
        )}
        <td className="px-4 py-3 text-right">
          <button onClick={onEdit} className="text-sm font-medium text-sky-700 hover:underline">
            Edit
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={colCount} className="bg-slate-50 px-4 py-4">
            {children}
          </td>
        </tr>
      )}
    </>
  );
}

function StreamsSubTable({
  college,
  streams,
  contacts,
  onAddStream,
}: {
  college: College;
  streams: CollegeStream[];
  contacts: CollegeContact[];
  onAddStream: () => void;
}) {
  const [stageDir, setStageDir] = useState<'asc' | 'desc' | null>(null);

  const primaryContactLabel = (contactId: number | null) => {
    if (contactId == null) return '—';
    const ct = contacts.find((x) => x.id === contactId);
    if (!ct) return '—';
    return `${ct.name} · ${humanize(ct.role)}`;
  };

  const rows = useMemo(() => {
    if (!stageDir) return streams;
    return [...streams].sort((a, b) => compareStage(a.stage, b.stage, stageDir));
  }, [streams, stageDir]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Streams
        </h3>
        <button
          onClick={onAddStream}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          + Add stream
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-400">
          No streams yet for {college.name}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Stream</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2 text-right">Total intake</th>
                <th className="px-3 py-2">
                  <button
                    onClick={() =>
                      setStageDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    className="flex items-center gap-1 font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
                  >
                    Stage
                    <span className="text-[10px]">
                      {stageDir ? (stageDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
                <th className="px-3 py-2">Next step</th>
                <th className="px-3 py-2">Next action</th>
                <th className="px-3 py-2">Primary contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">{s.stream_name}</td>
                  <td className="px-3 py-2 text-slate-600">{s.department || '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {s.final_year_strength ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StageBadge stage={s.stage} />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{s.current_next_step || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{s.next_action_date || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {primaryContactLabel(s.primary_contact_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
