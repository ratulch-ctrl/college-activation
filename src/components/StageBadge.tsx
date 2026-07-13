import type { StreamStage } from '@/lib/types';
import { humanize } from '@/lib/types';

const STAGE_CLASSES: Record<StreamStage, string> = {
  IDENTIFIED: 'bg-slate-100 text-slate-700 ring-slate-200',
  CONTACTED: 'bg-sky-100 text-sky-800 ring-sky-200',
  IN_DISCUSSION: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  AGREED: 'bg-amber-100 text-amber-800 ring-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  COMPLETED: 'bg-teal-100 text-teal-800 ring-teal-200',
  DORMANT: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  REJECTED: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export function StageBadge({ stage }: { stage: StreamStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STAGE_CLASSES[stage]}`}
    >
      {humanize(stage)}
    </span>
  );
}
