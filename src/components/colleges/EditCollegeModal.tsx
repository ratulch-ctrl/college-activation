'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import {
  addCompetitorAction,
  deleteCompetitorAction,
  updateCollegeAction,
} from '@/app/colleges/actions';
import {
  COLLEGE_CATEGORIES,
  COMPETITOR_STRENGTHS,
  INTERNAL_PRIORITY_TIERS,
  humanize,
  type City,
  type College,
  type CollegeCompetitor,
  type TeamMember,
} from '@/lib/types';

export function EditCollegeModal({
  college,
  cities,
  teamMembers,
  competitors,
  onClose,
}: {
  college: College;
  cities: City[];
  teamMembers: TeamMember[];
  competitors: CollegeCompetitor[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(college.name);
  const [cityId, setCityId] = useState(String(college.city_id));
  const [category, setCategory] = useState(college.category);
  const [ownerId, setOwnerId] = useState(
    college.owner_bdm_id != null ? String(college.owner_bdm_id) : '',
  );
  const [mapsLink, setMapsLink] = useState(college.google_maps_link ?? '');
  const [affiliation, setAffiliation] = useState(college.affiliation ?? '');
  const [accreditation, setAccreditation] = useState(college.accreditation ?? '');
  const [tier, setTier] = useState(college.internal_priority_tier ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await updateCollegeAction(college.id, {
      name,
      city_id: Number(cityId),
      category,
      owner_bdm_id: ownerId ? Number(ownerId) : null,
      google_maps_link: mapsLink,
      affiliation,
      accreditation,
      internal_priority_tier: (tier || null) as College['internal_priority_tier'],
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal title={`Edit ${college.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="College name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <select
              required
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="input"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as College['category'])}
              className="input"
            >
              {COLLEGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner BDM">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="input"
            >
              <option value="">— none —</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Internal priority tier">
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="input">
              <option value="">— none —</option>
              {INTERNAL_PRIORITY_TIERS.map((t) => (
                <option key={t} value={t}>
                  Tier {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Google Maps link">
          <input
            type="url"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            className="input"
            placeholder="https://maps.google.com/…"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Affiliation">
            <input
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="input"
              placeholder="e.g. Autonomous"
            />
          </Field>
          <Field label="Accreditation">
            <input
              value={accreditation}
              onChange={(e) => setAccreditation(e.target.value)}
              className="input"
              placeholder="e.g. NAAC A++"
            />
          </Field>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <CompetitorsSection collegeId={college.id} competitors={competitors} />
      </div>
    </Modal>
  );
}

function CompetitorsSection({
  collegeId,
  competitors,
}: {
  collegeId: number;
  competitors: CollegeCompetitor[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [since, setSince] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await addCompetitorAction({
      college_id: collegeId,
      competitor_name: name,
      strength: (strength || null) as CollegeCompetitor['strength'],
      active_since: since || null,
    });
    setBusy(false);
    setName('');
    setStrength('');
    setSince('');
    router.refresh();
  }

  async function handleDelete(id: number) {
    setBusy(true);
    await deleteCompetitorAction(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">Competitor intel</h3>
      {competitors.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No competitors tracked yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {competitors.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium text-slate-800">{c.competitor_name}</span>
                {c.strength && (
                  <span className="ml-2 text-xs text-slate-500">{humanize(c.strength)}</span>
                )}
                {c.active_since && (
                  <span className="ml-2 text-xs text-slate-400">since {c.active_since}</span>
                )}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(c.id)}
                className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Competitor name"
          className="input flex-1 min-w-[10rem]"
        />
        <select value={strength} onChange={(e) => setStrength(e.target.value)} className="input w-auto">
          <option value="">Strength…</option>
          {COMPETITOR_STRENGTHS.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={since}
          onChange={(e) => setSince(e.target.value)}
          className="input w-auto"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
