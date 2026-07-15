'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { createCollegeAction } from '@/app/colleges/actions';
import { INTERNAL_PRIORITY_TIERS, type City } from '@/lib/types';

export function AddCollegeModal({
  cities,
  onClose,
}: {
  cities: City[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState<string>(cities[0] ? String(cities[0].id) : '');
  const [tier, setTier] = useState<string>('');
  const [mapsLink, setMapsLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createCollegeAction({
      name,
      city_id: Number(cityId),
      internal_priority_tier: tier as 'A' | 'B' | 'C',
      google_maps_link: mapsLink,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal title="Add college" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="College name">
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g. Christ University"
          />
        </Field>
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
        <Field label="Internal priority tier">
          <select
            required
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="input"
          >
            <option value="" disabled>
              Select a tier…
            </option>
            {INTERNAL_PRIORITY_TIERS.map((t) => (
              <option key={t} value={t}>
                Tier {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Google Maps link">
          <input
            required
            type="url"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            className="input"
            placeholder="https://maps.google.com/…"
          />
        </Field>

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
            {submitting ? 'Adding…' : 'Add college'}
          </button>
        </div>
      </form>
    </Modal>
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
