import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import type { Bundle, Dict, Plan } from 'src/schema';
import { cn } from '../../../../lib/utils/cn';
import { Labeled } from '../../../../ui/components/Labeled';
import { Button } from '../../../../ui/inputs/Button';
import { Input } from '../../../../ui/inputs/Input';
import { Toggle } from '../../../../ui/inputs/Toggle';

type ID = string;
type PartialBundle = Partial<Bundle>;

interface Props {
  plan: Plan & Record<string, unknown>;
  bundles: (Bundle & Record<string, unknown>)[];
  dirtyBundles?: Dict;
  bundleFieldDirty: Record<string, Set<string>>;
  bundleFieldsToShow: string[];
  onDiscardPlan?: (planId: string) => void;
  onChangeBundle: (bundleId: ID, patch: PartialBundle) => void;
  onDiscardBundle?: (bundleId: ID) => void;
}

export const PlanBundlesRowCard: React.FC<Props> = ({
  plan,
  bundles,
  dirtyBundles = {},
  bundleFieldDirty,
  bundleFieldsToShow,
  onDiscardPlan,
  onChangeBundle,
  onDiscardBundle,
}) => {
  const [open, setOpen] = useState(true);
  const isBundleFieldDirty = (bid: string, field: keyof Bundle) =>
    bundleFieldDirty?.[bid]?.has(field as string) ?? false;
  const anyDirty = dirtyBundles && Object.values(dirtyBundles).some(Boolean);

  return (
    <div
      className={cn(
        'relative isolate my-2 mx-2 rounded-xl border bg-white shadow-sm',
        anyDirty && 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl bg-slate-200 px-4 py-2">
        <button
          className="inline-flex items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium">{plan.name}</span>
          <span className="text-xs text-slate-500">#{String(plan.id).slice(0, 8)}</span>
          {anyDirty && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              dirty
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {onDiscardPlan && dirtyBundles && (
            <Button variant="ghost" size="sm" onClick={() => onDiscardPlan(plan.id)}>
              Discard Plan
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t">
          {/* Optional header strip */}
          <div className="px-4 py-2 text-sm text-slate-600 border-b bg-slate-50">
            Channels associated with this plan
          </div>

          <div role="list" className="divide-y">
            {bundles.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-500">No channels linked.</div>
            )}

            {bundles.map((bundle) => {
              const isDirty = !!dirtyBundles[bundle.id];
              return (
                <div key={bundle.id} role="listitem" className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bundle.name}</span>
                      <span className="text-xs text-slate-500">
                        #{String(bundle.id).slice(0, 8)}
                      </span>
                      {isDirty && (
                        <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                          dirty
                        </span>
                      )}
                    </div>

                    {onDiscardBundle && isDirty && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDiscardBundle?.(bundle.id)}
                        className="shrink-0"
                      >
                        Discard
                      </Button>
                    )}
                  </div>

                  {/* Editable fields for the channel */}
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {bundleFieldsToShow.includes('name') && (
                      <Labeled label="Bundle Name">
                        <Input
                          type="text"
                          value={(bundle.name as string | undefined) ?? ''}
                          onChange={(e) =>
                            onChangeBundle(bundle.id, { name: e.target.value || '' })
                          }
                          placeholder="Bundle Name"
                          className={cn(
                            isBundleFieldDirty(bundle.id, 'name') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('description') && (
                      <Labeled label="Bundle Description">
                        <Input
                          type="text"
                          value={(bundle.description as string | undefined) ?? ''}
                          onChange={(e) =>
                            onChangeBundle(bundle.id, { description: e.target.value || '' })
                          }
                          placeholder="Bundle Description"
                          className={cn(
                            isBundleFieldDirty(bundle.id, 'description') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('basePrice') && (
                      <Labeled label="Base Price">
                        <Input
                          type="number"
                          value={(bundle.price as number | undefined) ?? 0}
                          onChange={(e) =>
                            onChangeBundle(bundle.id, {
                              basePrice: Number((e.target.value ?? '0') || 0),
                            })
                          }
                          placeholder="Base Price"
                          className={cn(
                            isBundleFieldDirty(bundle.id, 'basePrice') &&
                              'ring-2 ring-amber-400/80 ring-offset-1',
                          )}
                        />
                      </Labeled>
                    )}
                    {bundleFieldsToShow.includes('isActive') && (
                      <Labeled label="Active?">
                        <div
                          className={cn(
                            isBundleFieldDirty(bundle.id, 'isActive') &&
                              'ring-2 ring-amber-400/80 ring-offset-1 rounded-xl p-1',
                          )}
                        >
                          <Toggle
                            id={`is-local-${bundle.id}`}
                            size="md"
                            labelLeft="No"
                            labelRight="Yes"
                            checked={Boolean(bundle.isActive)}
                            onChange={(next) => onChangeBundle(bundle.id, { isActive: next })}
                          />
                        </div>
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
