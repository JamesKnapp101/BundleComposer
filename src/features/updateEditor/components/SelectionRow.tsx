import * as React from 'react';
import { BundleSchema, ChannelSchema, PlanSchema } from '../../../schema';
import { BCSelect } from '../../../ui/inputs/Select';
import { UpdateType, type EditorPhase, type UpdateArgs } from '../types';

interface Props {
  job: {
    id: string;
    type: UpdateType;
    args: UpdateArgs;
  } | null;
  phase: EditorPhase;
  onTypePicked: (t: UpdateType) => void;
  onArgsChange: (partial: Partial<UpdateArgs>) => void;
  onConfirmConfig: () => void;
}

const parseCSV = (str: string) =>
  str
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Returns true if the current args satisfy the minimum required inputs for the chosen type */
const isConfigValid = (args: UpdateArgs | undefined): boolean => {
  if (!args) return false;
  switch (args.type) {
    case UpdateType.PlanProperties:
      return true;
    case UpdateType.PlanChannels:
      return true;
    case UpdateType.PlanBundles:
      return true;
    case UpdateType.PlanBundleProperties:
      // need at least one bundle or one property key to make sense
      return Boolean(
        (args.bundleIds && args.bundleIds.length) ||
          (args.propertyKeys && args.propertyKeys.length),
      );
    default:
      return false;
  }
};

export const SelectionRow: React.FC<Props> = ({
  job,
  phase,
  onTypePicked,
  onArgsChange,
  onConfirmConfig,
}) => {
  const args = job?.args;
  const makeReadable = (s: string) =>
    s
      .replace(/[_-]/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .replace(/^.|(?:\s)./g, (m) => m.toUpperCase());

  const handleContinue = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (isConfigValid(args!)) onConfirmConfig();
  };
  const EXCLUDE = new Set(['id', 'createdAt', 'updatedAt']);
  const disabled = !isConfigValid(args);
  const showArgs = job?.type && phase !== 'edit' && phase !== 'submitted';

  return (
    <section
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5"
      data-testid="selection-row"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Update Type */}
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-slate-900">{'Update Type'}</label>
          <BCSelect
            placeholder="Select…"
            clearable={false}
            value={job?.type ?? undefined}
            onChange={(next) => onTypePicked(next as UpdateType)}
            options={[
              { label: 'Plan Properties', value: UpdateType.PlanProperties },
              { label: 'Plan Channels', value: UpdateType.PlanChannels },
              { label: 'Plan Bundles', value: UpdateType.PlanBundles },
              { label: 'Plan Bundle Properties', value: UpdateType.PlanBundleProperties },
            ]}
          />
        </div>
        {/* Conditional Args */}
        {showArgs && args?.type === UpdateType.PlanProperties && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-900">Properties (optional)</label>
            <BCSelect
              multiple
              options={(PlanSchema.keyof().options as string[])
                .filter((key) => !EXCLUDE.has(key))
                .map((key) => ({ value: key, label: makeReadable(key) }))}
              //@ts-ignore
              value={job?.args?.planPropertyKeys ?? []}
              onChange={(next) =>
                onArgsChange({
                  type: UpdateType.PlanProperties,
                  planPropertyKeys: (next as string[]) ?? [],
                })
              }
              placeholder="Choose properties…"
              clearable
              //@ts-ignore
              buttonProps={{ 'data-testid': 'plan-properties-input' }}
              ariaLabel="Plan properties"
            />

            <p id="plan-properties-hint" className="mt-1 text-xs text-slate-500">
              {'Select fields to edit. Leave blank to show all common plan fields.'}
            </p>
          </div>
        )}

        {showArgs && args?.type === UpdateType.PlanChannels && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-900">Scope</label>
              <BCSelect
                multiple
                options={(ChannelSchema.keyof().options as string[])
                  .filter((key) => !EXCLUDE.has(key))
                  .map((key) => ({ value: key, label: makeReadable(key) }))}
                //@ts-ignore
                value={job?.args?.channelPropertyKeys ?? []}
                onChange={(next) =>
                  onArgsChange({
                    type: UpdateType.PlanChannels,
                    channelPropertyKeys: (next as string[]) ?? [],
                  })
                }
                placeholder="Choose properties…"
                clearable
                //@ts-ignore
                buttonProps={{ 'data-testid': 'plan-properties-input' }}
                ariaLabel="Plan properties"
              />
            </div>
            <div className="md:col-span-1 md:col-start-3">
              <label className="text-sm font-medium text-slate-900">Channel IDs (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="c1,c7,c12"
                onChange={(e) =>
                  onArgsChange({
                    type: UpdateType.PlanChannels,
                    channelIds: parseCSV(e.target.value),
                  })
                }
                data-testid="channels-ids-input"
                aria-describedby="channels-ids-hint"
              />
              <p id="channels-ids-hint" className="mt-1 text-xs text-slate-500">
                Blank = all channels in selected scope.
              </p>
            </div>
          </>
        )}

        {showArgs && args?.type === UpdateType.PlanBundles && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-900">Scope</label>
              <BCSelect
                multiple
                options={(BundleSchema.keyof().options as string[])
                  .filter((key) => !EXCLUDE.has(key))
                  .map((key) => ({ value: key, label: makeReadable(key) }))}
                //@ts-ignore
                value={job?.args?.bundlePropertyKeys ?? []}
                onChange={(next) =>
                  onArgsChange({
                    type: UpdateType.PlanBundles,
                    bundlePropertyKeys: (next as string[]) ?? [],
                  })
                }
                placeholder="Choose properties…"
                clearable
                //@ts-ignore
                buttonProps={{ 'data-testid': 'plan-properties-input' }}
                ariaLabel="Bundle properties"
              />
            </div>
          </>
        )}

        {showArgs && args?.type === UpdateType.PlanBundleProperties && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-900">Bundle IDs</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="b1,b2"
                onChange={(e) =>
                  onArgsChange({
                    type: UpdateType.PlanBundleProperties,
                    bundleIds: parseCSV(e.target.value),
                  })
                }
                data-testid="bundle-props-ids-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-900">Property Keys</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="price,contractTerm"
                onChange={(e) =>
                  onArgsChange({
                    type: UpdateType.PlanBundleProperties,
                    propertyKeys: parseCSV(e.target.value),
                  })
                }
                data-testid="bundle-props-keys-input"
              />
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleContinue}
          onKeyDown={(e) => e.key === 'Enter' && handleContinue(e)}
          disabled={disabled}
          aria-disabled={disabled}
          title={disabled ? 'Complete required fields' : 'Continue'}
          className={[
            'inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
            disabled
              ? 'cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200'
              : 'bg-indigo-600 text-white shadow-sm ring-1 ring-inset ring-indigo-600 hover:bg-indigo-500',
          ].join(' ')}
          data-testid="selection-continue-button"
        >
          Continue
        </button>
      </div>
    </section>
  );
};
