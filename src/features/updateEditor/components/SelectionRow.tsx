// SelectionRow.tsx
import * as React from 'react';

export const UpdateType = {
  PlanProperties: 'plan-properties',
  PlanChannels: 'plan-channels',
  PlanBundles: 'plan-bundles',
  PlanBundleProperties: 'plan-bundle-properties',
} as const;
export type UpdateType = (typeof UpdateType)[keyof typeof UpdateType];

export type UpdateArgs =
  | { type: typeof UpdateType.PlanProperties; planPropertyKeys?: string[] }
  | {
      type: typeof UpdateType.PlanChannels;
      channelIds?: string[];
      scope?: 'all' | 'local' | 'non-local';
    }
  | { type: typeof UpdateType.PlanBundles; bundleIds?: string[]; mode?: 'add' | 'remove' | 'edit' }
  | { type: typeof UpdateType.PlanBundleProperties; bundleIds?: string[]; propertyKeys?: string[] };

export type EditorPhase = 'select' | 'configure' | 'edit' | 'submitted';

type Props = {
  job: {
    id: string;
    type: UpdateType;
    args: UpdateArgs;
  } | null;
  phase: EditorPhase;
  onTypePicked: (t: UpdateType) => void;
  onArgsChange: (partial: Partial<UpdateArgs>) => void; // will be merged by caller
  onConfirmConfig: () => void;
};

const DEFAULT_PLAN_PROPERTY_HINT = 'name,tier,effectiveDate';
const parseCSV = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Returns true if the current args satisfy the minimum required inputs for the chosen type */
function isConfigValid(args: UpdateArgs | undefined): boolean {
  if (!args) return false;
  switch (args.type) {
    case UpdateType.PlanProperties:
      // optional keys; valid even if none picked (means "all visible props")
      return true;
    case UpdateType.PlanChannels:
      // if channelIds omitted, treat as "all in scope" — require scope at least
      return !!args.scope;
    case UpdateType.PlanBundles:
      return !!args.mode; // bundleIds optional depending on mode; keep simple here
    case UpdateType.PlanBundleProperties:
      // need at least one bundle or one property key to make sense
      return Boolean(
        (args.bundleIds && args.bundleIds.length) ||
          (args.propertyKeys && args.propertyKeys.length),
      );
    default:
      return false;
  }
}

export const SelectionRow: React.FC<Props> = ({
  job,
  phase,
  onTypePicked,
  onArgsChange,
  onConfirmConfig,
}) => {
  const args = job?.args;

  const handleContinue = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (isConfigValid(args!)) onConfirmConfig();
  };

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
          <label className="text-sm font-medium text-slate-900">Update Type</label>
          <select
            className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={job?.type ?? ''}
            onChange={(e) => onTypePicked(e.target.value as UpdateType)}
            data-testid="update-type-select"
          >
            <option value="" disabled>
              Select…
            </option>
            <option value={UpdateType.PlanProperties}>Plan Properties</option>
            <option value={UpdateType.PlanChannels}>Plan Channels</option>
            <option value={UpdateType.PlanBundles}>Plan Bundles</option>
            <option value={UpdateType.PlanBundleProperties}>Plan Bundle Properties</option>
          </select>
        </div>

        {/* Conditional Args */}
        {showArgs && args?.type === UpdateType.PlanProperties && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-900">Properties (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={DEFAULT_PLAN_PROPERTY_HINT}
              onChange={(e) =>
                onArgsChange({
                  type: UpdateType.PlanProperties,
                  planPropertyKeys: parseCSV(e.target.value),
                })
              }
              data-testid="plan-properties-input"
              aria-describedby="plan-properties-hint"
            />
            <p id="plan-properties-hint" className="mt-1 text-xs text-slate-500">
              Comma-separated keys. Leave blank to show common plan fields.
            </p>
          </div>
        )}

        {showArgs && args?.type === UpdateType.PlanChannels && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-900">Scope</label>
              <select
                className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={args.scope ?? ''}
                onChange={(e) =>
                  onArgsChange({
                    type: UpdateType.PlanChannels,
                    scope: e.target.value as 'all' | 'local' | 'non-local',
                  })
                }
                data-testid="channels-scope-select"
              >
                <option value="" disabled>
                  Select…
                </option>
                <option value="all">All</option>
                <option value="local">Local</option>
                <option value="non-local">Non-local</option>
              </select>
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
              <label className="text-sm font-medium text-slate-900">Mode</label>
              <select
                className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={args.mode ?? ''}
                onChange={(e) =>
                  onArgsChange({
                    type: UpdateType.PlanBundles,
                    mode: e.target.value as 'add' | 'remove' | 'edit',
                  })
                }
                data-testid="bundles-mode-select"
              >
                <option value="" disabled>
                  Select…
                </option>
                <option value="add">Add</option>
                <option value="remove">Remove</option>
                <option value="edit">Edit</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-900">Bundle IDs (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="b3,b9"
                onChange={(e) =>
                  onArgsChange({
                    type: UpdateType.PlanBundles,
                    bundleIds: parseCSV(e.target.value),
                  })
                }
                data-testid="bundles-ids-input"
                aria-describedby="bundles-ids-hint"
              />
              <p id="bundles-ids-hint" className="mt-1 text-xs text-slate-500">
                Provide when removing/editing specific bundles. Blank is OK for “add”.
              </p>
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
