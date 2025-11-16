import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../../../lib/utils/cn';
import {
  BundleTypeSchema,
  CurrencySchema,
  GenreSchema,
  type Bundle,
  type BundleType,
  type Currency,
  type Dict,
  type Genre,
  type Plan,
} from '../../../../schema';
import { Labeled } from '../../../../ui/components/Labeled';
import { Button } from '../../../../ui/inputs/Button';
import { Input } from '../../../../ui/inputs/Input';
import { BCSelect } from '../../../../ui/inputs/Select';
import { Toggle } from '../../../../ui/inputs/Toggle';

type ID = string;
type PartialBundle = Partial<Bundle>;

interface Props {
  plan: Plan & Record<string, unknown>;
  bundles: (Bundle & Record<string, unknown>)[];
  dirtyBundles?: Dict; // linkKey -> dirty
  bundleFieldDirty: Record<string, Set<string>>;
  bundleFieldsToShow: string[];
  removedBundleIdsByPlanId?: Record<string, string[]>;
  addedBundleIdsByPlanId?: Record<string, string[]>;
  onDiscardPlan?: (planId: string) => void;
  onChangeBundle: (bundleLinkKey: ID, patch: PartialBundle) => void;
  onDiscardBundle?: (bundleLinkKey: ID) => void;
  onAddBundleToPlan?: (planId: string, bundleId: string) => void;
  onRemoveBundleFromPlan?: (planId: string, bundleId: string) => void;
  onOpenBundlePicker?: (planId: string) => void;
}

export const PlanBundlesRowCard: React.FC<Props> = ({
  plan,
  bundles,
  dirtyBundles = {},
  bundleFieldDirty,
  bundleFieldsToShow,
  removedBundleIdsByPlanId,
  addedBundleIdsByPlanId,
  onDiscardPlan,
  onChangeBundle,
  onDiscardBundle,
  onAddBundleToPlan,
  onRemoveBundleFromPlan,
  onOpenBundlePicker,
}) => {
  const [open, setOpen] = useState(true);
  const isBundleFieldDirty = (linkKey: string, field: keyof Bundle) =>
    bundleFieldDirty?.[linkKey]?.has(field as string) ?? false;
  const removedIdsForPlan = removedBundleIdsByPlanId?.[plan.id] ?? [];
  const addedIdsForPlan = addedBundleIdsByPlanId?.[plan.id] ?? [];
  const isBundleRemoved = (bundleId: string) => removedIdsForPlan.includes(bundleId);
  const isBundleAdded = (bundleId: string) => addedIdsForPlan.includes(bundleId);
  const anyDirty = dirtyBundles && Object.values(dirtyBundles).some(Boolean);
  const anyRemoved = bundles.some((b) => isBundleRemoved(b.id));

  console.log('anyDirty ', anyDirty);

  return (
    <div
      className={cn(
        'relative isolate my-2 mx-2 rounded-xl border bg-white shadow-sm',
        anyDirty && 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white',
        anyRemoved && 'border-red-300',
      )}
    >
      <div className="flex items-center justify-between rounded-t-xl bg-slate-200 px-4 py-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium">{plan.name}</span>
          <span className="text-xs text-slate-500">#{String(plan.id).slice(0, 8)}</span>
          {anyDirty && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {'edited'}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {onOpenBundlePicker && onAddBundleToPlan && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="inline-flex items-center gap-1"
              onClick={() => onOpenBundlePicker(plan.id)}
            >
              <Plus className="h-3 w-3" />
              <span>{'Add bundles from catalog'}</span>
            </Button>
          )}

          {onDiscardPlan && dirtyBundles && (
            <Button variant="ghost" size="sm" onClick={() => onDiscardPlan(plan.id)}>
              {'Discard Plan'}
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t">
          <div className="px-4 py-2 text-sm text-slate-600 border-b bg-slate-50">
            {'Bundles associated with this plan'}
          </div>
          <div role="list" className="divide-y">
            {bundles.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-500">{'No bundles linked.'}</div>
            )}
            {bundles.map((bundle, sortIndex) => {
              const linkKey = `${plan.id}:${bundle.id}:${sortIndex}`;
              const isDirty = !!dirtyBundles[linkKey];
              const removed = isBundleRemoved(bundle.id);
              const added = isBundleAdded(bundle.id);

              return (
                <div
                  key={linkKey}
                  role="listitem"
                  className={cn(
                    'px-4 py-3 rounded-md',
                    removed && 'border border-red-300 bg-red-50/60',
                    added && !removed && 'border border-emerald-300 bg-emerald-50/70',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {(onRemoveBundleFromPlan || onAddBundleToPlan) && (
                        <button
                          type="button"
                          aria-label={
                            removed ? 'Restore bundle to plan' : 'Remove bundle from plan'
                          }
                          className="mt-0.5 rounded-full p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => {
                            if (removed) {
                              onAddBundleToPlan?.(plan.id, bundle.id);
                            } else {
                              onRemoveBundleFromPlan?.(plan.id, bundle.id);
                            }
                          }}
                        >
                          {removed ? (
                            <RotateCcw className="h-4 w-4 text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <span className="font-medium">{bundle.name}</span>
                      <span className="text-xs text-slate-500">
                        #{String(bundle.id).slice(0, 8)}
                      </span>

                      {added && !removed && (
                        <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          {'new'}
                        </span>
                      )}

                      {removed && (
                        <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          {'removed'}
                        </span>
                      )}

                      {isDirty && !removed && !added && (
                        <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                          {'edited'}
                        </span>
                      )}
                    </div>

                    {onDiscardBundle && isDirty && !removed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDiscardBundle?.(linkKey)}
                        className="shrink-0"
                      >
                        {'Discard'}
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {bundleFieldsToShow.includes('name') && (
                      <Labeled label="Bundle Name">
                        <Input
                          type="text"
                          value={(bundle.name as string | undefined) ?? ''}
                          onChange={(e) => onChangeBundle(linkKey, { name: e.target.value || '' })}
                          placeholder="Bundle Name"
                          className={cn(
                            isBundleFieldDirty(linkKey, 'name') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('description') && (
                      <Labeled label="Bundle Description">
                        <Input
                          type="text"
                          value={(bundle.description as string | undefined) ?? ''}
                          onChange={(e) =>
                            onChangeBundle(linkKey, { description: e.target.value || '' })
                          }
                          placeholder="Bundle Description"
                          className={cn(
                            isBundleFieldDirty(linkKey, 'description') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('bundleType') && (
                      <Labeled label={'Bundle Type'}>
                        <BCSelect
                          options={BundleTypeSchema.options.map((bt) => ({
                            label: bt,
                            value: bt,
                          }))}
                          value={bundle.bundleType as BundleType | undefined}
                          onChange={(next) =>
                            onChangeBundle(linkKey, {
                              bundleType: next as BundleType | undefined,
                            })
                          }
                          className={cn(
                            isBundleFieldDirty(linkKey, 'bundleType') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('isAddOn') && (
                      <Labeled label="Is Add On?">
                        <div
                          className={cn(
                            isBundleFieldDirty(linkKey, 'isAddOn') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-isAddOn-${linkKey}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(bundle.isAddOn)}
                            onChange={(next) => onChangeBundle(linkKey, { isAddOn: next })}
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('isExclusive') && (
                      <Labeled label="Is Exclusive?">
                        <div
                          className={cn(
                            isBundleFieldDirty(linkKey, 'isExclusive') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-isExclusive-${linkKey}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(bundle.isExclusive)}
                            onChange={(next) => onChangeBundle(linkKey, { isExclusive: next })}
                            disabled={removed}
                          />
                        </div>
                      </Labeled>
                    )}

                    {bundleFieldsToShow.includes('addOnPrice') && (
                      <Labeled label="Add On Price">
                        <Input
                          type="number"
                          value={(bundle.addOnPrice as number | undefined) ?? 0}
                          onChange={(e) =>
                            onChangeBundle(linkKey, {
                              addOnPrice: Number((e.target.value ?? '0') || 0),
                            })
                          }
                          placeholder="Add On Price"
                          className={cn(
                            isBundleFieldDirty(linkKey, 'addOnPrice') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                          disabled={removed}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('currency') && (
                      <Labeled label={'Currency'}>
                        <BCSelect
                          options={CurrencySchema.options.map((bc) => ({
                            label: bc,
                            value: bc,
                          }))}
                          value={bundle.currency as Currency | undefined}
                          onChange={(next) =>
                            onChangeBundle(linkKey, {
                              currency: next as Currency | undefined,
                            })
                          }
                          className={cn(
                            isBundleFieldDirty(linkKey, 'currency') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('primaryGenre') && (
                      <Labeled label={'Bundle Type'}>
                        <BCSelect
                          options={GenreSchema.options.map((g) => ({
                            label: g,
                            value: g,
                          }))}
                          value={bundle.primaryGenre as Genre | undefined}
                          onChange={(next) =>
                            onChangeBundle(linkKey, {
                              primaryGenre: next as Genre | undefined,
                            })
                          }
                          className={cn(
                            isBundleFieldDirty(linkKey, 'primaryGenre') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl',
                          )}
                        />
                      </Labeled>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
