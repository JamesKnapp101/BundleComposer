// JobBar.tsx
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

type Job = {
  id: string;
  type: UpdateType;
  args: UpdateArgs;
};

type Props = {
  job: Job;
  onChange: () => void; // “Change…” selection row flow
  isDirty?: boolean; // disables Change when true
  rightExtra?: React.ReactNode; // optional slot for actions (Discard, etc.)
};

export const JobBar: React.FC<Props> = ({ job, onChange, isDirty = false, rightExtra }) => {
  return (
    <div
      className="flex items-center justify-between rounded-2xl border bg-slate-50 px-3 py-2 mt-2"
      data-testid="job-bar"
    >
      <div className="min-w-0 flex items-center gap-3">
        <span className="inline-flex items-center rounded-md border bg-white px-2 py-1 text-xs font-medium">
          {labelForType(job.type)}
        </span>
        <div className="truncate text-sm text-slate-700" title={summarizeArgs(job.args)}>
          {summarizeArgs(job.args)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightExtra}
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-sm underline disabled:opacity-50"
          onClick={onChange}
          disabled={isDirty}
          title={isDirty ? 'You have unsaved changes' : 'Change selection'}
          data-testid="job-bar-change-button"
        >
          Change…
        </button>
      </div>
    </div>
  );
};

/* helpers */

function labelForType(t: UpdateType): string {
  switch (t) {
    case UpdateType.PlanProperties:
      return 'Plan Properties';
    case UpdateType.PlanChannels:
      return 'Plan Channels';
    case UpdateType.PlanBundles:
      return 'Plan Bundles';
    case UpdateType.PlanBundleProperties:
      return 'Plan Bundle Properties';
    default:
      return 'Update';
  }
}

function summarizeArgs(args: UpdateArgs): string {
  switch (args.type) {
    case UpdateType.PlanProperties: {
      const keys = args.planPropertyKeys?.length
        ? args.planPropertyKeys.join(', ')
        : 'All common properties';
      return `Fields: ${keys}`;
    }
    case UpdateType.PlanChannels: {
      const scope = args.scope ?? '—';
      const ids = args.channelIds?.length ? `${args.channelIds.length} channel(s)` : 'All channels';
      return `Scope: ${scope} · ${ids}`;
    }
    case UpdateType.PlanBundles: {
      const mode = args.mode ?? '—';
      const ids = args.bundleIds?.length
        ? `${args.bundleIds.length} bundle(s)`
        : mode === 'add'
          ? 'Add new'
          : 'All bundles';
      return `Mode: ${mode} · ${ids}`;
    }
    case UpdateType.PlanBundleProperties: {
      const ids = args.bundleIds?.length ? `${args.bundleIds.length} bundle(s)` : 'All bundles';
      const keys = args.propertyKeys?.length ? `${args.propertyKeys.length} key(s)` : 'All keys';
      return `${ids} · ${keys}`;
    }
    default:
      return '';
  }
}
