import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { patchPlanField } from '../../../../features/updateEditor/updateEditorSlice';
import { cn } from '../../../../lib/utils/cn';
import {
  CurrencySchema,
  PlanStatusSchema,
  PriceModelSchema,
  ResolutionSchema,
  TierSchema,
  type Currency,
  type Plan,
  type PlanStatus,
  type PriceModel,
  type Resolution,
  type Tier,
} from '../../../../schema';
import { Labeled } from '../../../../ui/components/Labeled';
import { Button } from '../../../../ui/inputs/Button';
import { Input } from '../../../../ui/inputs/Input';
import { BCSelect } from '../../../../ui/inputs/Select';
import { Toggle } from '../../../../ui/inputs/Toggle';

interface Props {
  jobId: string;
  mergedPlan: Plan & Record<string, unknown>;
  originalPlan: Plan & Record<string, unknown>;
  dirty: boolean;
  planFieldDirty?: Record<string, Set<string>>;
  fieldsToShow: string[];
  onChange: (patch: Partial<Plan>) => void;
  onDiscard: () => void;
}

const PlanRowCardInner = ({
  jobId,
  mergedPlan,
  originalPlan,
  dirty,
  planFieldDirty = {},
  // onChange,
  onDiscard,
  fieldsToShow,
}: Props) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(true);
  const baselineRef = useRef(originalPlan);

  useEffect(() => {
    baselineRef.current = originalPlan;
  }, [originalPlan]);

  const isFieldDirty = (field: keyof Plan) => {
    return planFieldDirty?.[mergedPlan.id]?.has(field as string) ?? false;
  };

  const handleFieldChange = <K extends keyof Plan>(field: K, value: Plan[K]) => {
    const baseline = baselineRef.current;
    //  onChange?.({ [field]: value });
    dispatch(
      patchPlanField({
        jobId,
        planId: mergedPlan.id,
        field,
        value,
        original: baseline[field],
      }),
    );
  };

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
          <span className="font-medium">{mergedPlan.name}</span>
          <span className="text-xs text-slate-500">#{String(mergedPlan.id).slice(0, 8)}</span>
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
                value={(mergedPlan.name as string | undefined) ?? ''}
                // onChange={(e) => onChange({ name: e.target.value || '' })}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Plan Name"
                className={cn(isFieldDirty('name') && 'ring-2 ring-amber-400/80 ring-offset-1')}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('description') && (
            <Labeled label={'Plan Description'}>
              <Input
                type="text"
                value={(mergedPlan.description as string | undefined) ?? ''}
                onChange={(e) => handleFieldChange('description', e.target.value || '')}
                placeholder="Plan Description"
                className={cn(
                  isFieldDirty('description') && 'ring-2 ring-amber-400/80 ring-offset-1',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('status') && (
            <Labeled label={'status'}>
              <BCSelect
                options={PlanStatusSchema.options.map((s) => ({ label: s, value: s }))}
                value={mergedPlan.status as PlanStatus | undefined}
                onChange={(next) => handleFieldChange('status', next as PlanStatus)}
                className={cn(
                  isFieldDirty('status') && 'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('planTier') && (
            <Labeled label={'Plan Tier'}>
              <BCSelect
                options={TierSchema.options.map((tier) => ({ label: tier, value: tier }))}
                value={mergedPlan.planTier as Tier | undefined}
                onChange={(next) => handleFieldChange('planTier', next as Tier)}
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
                value={mergedPlan.pricingModel as PriceModel | undefined}
                onChange={(next) => handleFieldChange('pricingModel', next as PriceModel)}
                className={cn(
                  isFieldDirty('pricingModel') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('monthlyPrice') && (
            <Labeled label={'Monthly Price'}>
              <Input
                type="number"
                value={(mergedPlan.monthlyPrice as number | undefined) ?? 0}
                onChange={(e) => handleFieldChange('monthlyPrice', Number(e.target.value || 0))}
                placeholder="Base price"
                className={cn(
                  isFieldDirty('monthlyPrice') && 'ring-2 ring-amber-400/80 ring-offset-1',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('currency') && (
            <Labeled label={'Currency'}>
              <BCSelect
                options={CurrencySchema.options.map((cur) => ({ label: cur, value: cur }))}
                value={mergedPlan.currency as Currency | undefined}
                onChange={(next) => handleFieldChange('currency', next as Currency)}
                className={cn(
                  isFieldDirty('currency') && 'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('maxProfiles') && (
            <Labeled label={'Max Profiles'}>
              <Input
                type="number"
                value={(mergedPlan.maxProfiles as number | undefined) ?? 0}
                onChange={(e) => handleFieldChange('maxProfiles', Number(e.target.value || 0))}
                placeholder="Max Profiles"
                className={cn(
                  isFieldDirty('maxProfiles') && 'ring-2 ring-amber-400/80 ring-offset-1',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('maxConcurrentStreams') && (
            <Labeled label={'Max Concurrent Streams'}>
              <Input
                type="number"
                value={(mergedPlan.maxConcurrentStreams as number | undefined) ?? 0}
                onChange={(e) =>
                  handleFieldChange('maxConcurrentStreams', Number(e.target.value || 0))
                }
                placeholder="Max Concurrent Streams"
                className={cn(
                  isFieldDirty('maxConcurrentStreams') && 'ring-2 ring-amber-400/80 ring-offset-1',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('maxResolution') && (
            <Labeled label={'Max Resolution'}>
              <BCSelect
                options={ResolutionSchema.options.map((res) => ({ label: res, value: res }))}
                value={mergedPlan.maxResolution as Resolution | undefined}
                onChange={(next) => handleFieldChange('maxResolution', next as Resolution)}
                className={cn(
                  isFieldDirty('maxResolution') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                )}
              />
            </Labeled>
          )}
          {fieldsToShow.includes('includesAds') && (
            <Labeled label="Includes Ads?">
              <div
                className={cn(
                  isFieldDirty('includesAds') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                )}
              >
                <Toggle
                  id={`is-includesAds-${mergedPlan.id}`}
                  size="md"
                  labelLeft="No"
                  labelRight="Yes"
                  checked={Boolean(mergedPlan.includesAds)}
                  onChange={(next) => handleFieldChange('includesAds', next)}
                />
              </div>
            </Labeled>
          )}
          {fieldsToShow.includes('includesCloudDvr') && (
            <Labeled label="Includes Cloud DVR?">
              <div
                className={cn(
                  isFieldDirty('includesCloudDvr') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                )}
              >
                <Toggle
                  id={`is-includesCloudDvr-${mergedPlan.id}`}
                  size="md"
                  labelLeft="No"
                  labelRight="Yes"
                  checked={Boolean(mergedPlan.includesCloudDvr)}
                  onChange={(next) => handleFieldChange('includesCloudDvr', next)}
                />
              </div>
            </Labeled>
          )}
          {fieldsToShow.includes('allowsOfflineDownloads') && (
            <Labeled label="Allows Offline Downloads?">
              <div
                className={cn(
                  isFieldDirty('allowsOfflineDownloads') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                )}
              >
                <Toggle
                  id={`is-active-${mergedPlan.id}`}
                  size="md"
                  labelLeft="No"
                  labelRight="Yes"
                  checked={Boolean(mergedPlan.allowsOfflineDownloads)}
                  onChange={(next) => handleFieldChange('allowsOfflineDownloads', next)}
                />
              </div>
            </Labeled>
          )}
          {fieldsToShow.includes('supportsMultipleHouseholds') && (
            <Labeled label="Supports Multiple Housolds?">
              <div
                className={cn(
                  isFieldDirty('supportsMultipleHouseholds') &&
                    'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                )}
              >
                <Toggle
                  id={`is-supportsMultipleHouseholds-${mergedPlan.id}`}
                  size="md"
                  labelLeft="No"
                  labelRight="Yes"
                  checked={Boolean(mergedPlan.supportsMultipleHouseholds)}
                  onChange={(next) => handleFieldChange('supportsMultipleHouseholds', next)}
                />
              </div>
            </Labeled>
          )}
          {fieldsToShow.includes('trialDays') && (
            <Labeled label={'Trial Days'}>
              <Input
                type="number"
                value={(mergedPlan.trialDays as number | undefined) ?? 0}
                onChange={(e) => handleFieldChange('trialDays', Number(e.target.value || 0))}
                placeholder="Trial Days"
                className={cn(
                  isFieldDirty('trialDays') && 'ring-2 ring-amber-400/80 ring-offset-1',
                )}
              />
            </Labeled>
          )}
        </div>
      )}
    </div>
  );
};

export const PlanRowCard = React.memo(PlanRowCardInner, (prev, next) => {
  // very simple but effective: same plan id and same dirty flag
  // and same reference for mergedPlan & planFieldDirty → skip
  return (
    prev.jobId === next.jobId &&
    prev.mergedPlan.id === next.mergedPlan.id &&
    prev.dirty === next.dirty &&
    prev.mergedPlan === next.mergedPlan &&
    prev.planFieldDirty === next.planFieldDirty &&
    prev.fieldsToShow === next.fieldsToShow
  );
});
