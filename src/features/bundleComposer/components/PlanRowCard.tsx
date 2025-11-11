import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Plan } from 'src/schema';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../../ui/inputs/Button';
import { Input } from '../../../ui/inputs/Input';

type Props = {
  plan: Plan; // merged (base + patch)
  dirty: boolean;
  onChange: (patch: Partial<Plan>) => void;
  onDiscard: () => void;
};

export function PlanRowCard({ plan, dirty, onChange, onDiscard }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={cn('my-2 rounded-xl border bg-white shadow-sm', dirty && 'ring-2 ring-amber-400')}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <button
          className="inline-flex items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium">{plan.name}</span>
          <span className="text-xs text-slate-500">#{plan.id.slice(0, 8)}</span>
          {dirty && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              dirty
            </span>
          )}
        </button>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={onDiscard}>
            Discard
          </Button>
        )}
      </div>

      {open && (
        <div className="grid gap-3 border-t px-4 py-3 md:grid-cols-3">
          <Labeled>
            <Input
              value={plan.planTier ?? ''}
              onChange={(e) => onChange({ planTier: e.target.value as any })}
              placeholder="Plan tier"
            />
            <label>Plan Tier</label>
          </Labeled>

          <Labeled>
            <Input
              value={plan.pricingModel ?? ''}
              onChange={(e) => onChange({ pricingModel: e.target.value as any })}
              placeholder="Pricing model"
            />
            <label>Pricing Model</label>
          </Labeled>

          <Labeled>
            <Input
              type="number"
              value={plan.basePrice ?? 0}
              onChange={(e) => onChange({ basePrice: Number(e.target.value || 0) })}
              placeholder="Base price"
            />
            <label>Base Price</label>
          </Labeled>

          {/* Add more fields as you need; keep each field mapping 1:1 to your patch */}
        </div>
      )}
    </div>
  );
}

function Labeled({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="mb-1 text-xs font-medium text-slate-600">{/* label via sibling */}</div>
      {children}
    </div>
  );
}
