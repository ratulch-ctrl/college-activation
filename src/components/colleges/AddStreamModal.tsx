'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { createStreamAction } from '@/app/colleges/actions';

export function AddStreamModal({
  collegeId,
  collegeName,
  onClose,
}: {
  collegeId: number;
  collegeName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [streamName, setStreamName] = useState('');
  const [department, setDepartment] = useState('');
  const [strength, setStrength] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createStreamAction({
      college_id: collegeId,
      stream_name: streamName,
      department,
      final_year_strength: Number(strength),
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
    <Modal title={`Add stream — ${collegeName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Stream name">
          <input
            autoFocus
            required
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            className="input"
            placeholder="e.g. Computer Science"
          />
        </Field>
        <Field label="Department">
          <input
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input"
            placeholder="e.g. Science"
          />
        </Field>
        <Field label="Total students per intake">
          <input
            required
            type="number"
            min={0}
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            className="input"
            placeholder="e.g. 120"
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
            {submitting ? 'Adding…' : 'Add stream'}
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
