import type { InternalPriorityTier } from '@/lib/types';

const TIER_CLASSES: Record<InternalPriorityTier, string> = {
  A: 'bg-violet-100 text-violet-800 ring-violet-200',
  B: 'bg-blue-100 text-blue-800 ring-blue-200',
  C: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function PriorityTierBadge({ tier }: { tier: InternalPriorityTier | null }) {
  if (!tier) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TIER_CLASSES[tier]}`}
    >
      Tier {tier}
    </span>
  );
}
