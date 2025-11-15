import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../../lib/utils/cn';
import {
  PlanStatusSchema,
  PriceModelSchema,
  TierSchema,
  type Plan,
  type PlanStatus,
  type PriceModel,
  type Tier,
} from '../../../../schema';
import { Labeled } from '../../../../ui/components/Labeled';
import { Button } from '../../../../ui/inputs/Button';
import { Input } from '../../../../ui/inputs/Input';
import { BCSelect } from '../../../../ui/inputs/Select';

interface Props {
  plan: Plan & Record<string, unknown>;
  dirty: boolean;
  planFieldDirty: Record<string, Set<string>>;
  fieldsToShow: string[];
  onChange: (patch: Partial<Plan>) => void;
  onDiscard: () => void;
}

export const PlanRowCard = ({
  plan,
  dirty,
  planFieldDirty,
  onChange,
  onDiscard,
  fieldsToShow,
}: Props) => {
  const [open, setOpen] = useState(true);
  const isFieldDirty = (field: keyof Plan) =>
    planFieldDirty?.[plan.id]?.has(field as string) ?? false;
  return (
    <div
      className={cn(
        'relative isolate my-2 mx-2 rounded-xl border bg-white shadow-sm',
        dirty && 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white',
      )}
    >
      <div className="flex items-center justify-between rounded-t-xl bg-slate-200 px-4 py-2">
        <button
          className="inline-flex items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium">{plan.name}</span>
          <span className="text-xs text-slate-500">#{String(plan.id).slice(0, 8)}</span>
          {dirty && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {'edited'}
            </span>
          )}
        </button>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={onDiscard}>
            {'Discard'}
          </Button>
        )}
      </div>
      {open && (
        <div className="grid auto-rows-min gap-3 border-t px-4 py-3 md:grid-cols-3">
          {fieldsToShow.includes('name') && (
            <Labeled label={'Plan Name'}>
              <Input
                type="text"
                value={(plan.name as string | undefined) ?? ''}
                onChange={(e) => onChange({ name: e.target.value || '' })}
                placeholder="Plan Name"
                className={cn(isFieldDirty('name') && 'ring-2 ring-amber-400/80 ring-offset-1')}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('planTier') && (
            <Labeled label={'Plan Tier'}>
              <BCSelect
                options={TierSchema.options.map((tier) => ({ label: tier, value: tier }))}
                value={plan.planTier as Tier | undefined}
                onChange={(next) => onChange({ planTier: next as Tier | undefined })}
                className={cn(
                  isFieldDirty('planTier') && 'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('pricingModel') && (
            <Labeled label={'Pricing Model'}>
              <BCSelect
                options={PriceModelSchema.options.map((pm) => ({ label: pm, value: pm }))}
                value={plan.pricingModel as PriceModel | undefined}
                onChange={(next) => onChange({ pricingModel: next as PriceModel | undefined })}
                className={cn(
                  isFieldDirty('pricingModel') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('basePrice') && (
            <Labeled label={'Base Price'}>
              <Input
                type="number"
                value={(plan.basePrice as number | undefined) ?? 0}
                onChange={(e) => onChange({ basePrice: Number(e.target.value || 0) })}
                placeholder="Base price"
                className={cn(
                  isFieldDirty('basePrice') && 'ring-2 ring-amber-400/80 ring-offset-1',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('status') && (
            <Labeled label={'status'}>
              <BCSelect
                options={PlanStatusSchema.options.map((s) => ({ label: s, value: s }))}
                value={plan.status as PlanStatus | undefined}
                onChange={(next) => onChange({ status: next as PlanStatus | undefined })}
                className={cn(
                  isFieldDirty('status') && 'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
        </div>
      )}
    </div>
  );
};
