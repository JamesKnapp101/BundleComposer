import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../../lib/utils/cn';

// ---- Types from updateEditor ----
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

export type UpdateJob = {
  id: string;
  type: UpdateType;
  args: UpdateArgs;
  planIds: string[];
  status: 'draft' | 'ready' | 'submitted';
  createdAt: number;
  // optional: displayName?: string; // add to your job if you want custom labels
};

export interface PagePickerProps {
  jobs: UpdateJob[];
  current: number; // currentJobIndex
  onChange: (nextIndex: number) => void;
  onSubmitWithValidation: () => Promise<boolean>;
  className?: string;
  'data-testid'?: string;
}

// Label helpers
function labelForType(t: UpdateType): string {
  switch (t) {
    case UpdateType.PlanProperties:
      return 'Plan Properties';
    case UpdateType.PlanChannels:
      return 'Plan Channels';
    case UpdateType.PlanBundles:
      return 'Plan Bundles';
    case UpdateType.PlanBundleProperties:
      return 'Bundle Properties';
    default:
      return 'Update';
  }
}

function summarizeJob(job: UpdateJob): string {
  const typeLabel = labelForType(job.type);
  switch (job.args.type) {
    case UpdateType.PlanProperties:
      return `${typeLabel}`;
    case UpdateType.PlanChannels:
      return `${typeLabel}${job.args.scope ? ` · ${job.args.scope}` : ''}`;
    case UpdateType.PlanBundles:
      return `${typeLabel}${job.args.mode ? ` · ${job.args.mode}` : ''}`;
    case UpdateType.PlanBundleProperties:
      return `${typeLabel}`;
    default:
      return typeLabel;
  }
}

export const PagePicker: React.FC<PagePickerProps> = ({
  jobs,
  current,
  onChange,
  onSubmitWithValidation,
  className,
  'data-testid': testId = 'plan-update-page-picker',
}) => {
  if (jobs.length <= 1) return null;

  const handleSelect = async (value: string) => {
    const ok = await onSubmitWithValidation();
    if (!ok) return;
    onChange(parseInt(value, 10));
  };

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid={testId}>
      <span className="text-sm text-slate-600">Navigate to Page</span>
      <Select value={String(current)} onValueChange={handleSelect}>
        <SelectTrigger className="w-[280px] justify-between">
          <SelectValue placeholder="Select a page…" />
          <ChevronDown className="h-4 w-4 opacity-70" />
        </SelectTrigger>
        <SelectContent>
          {jobs.map((job, idx) => (
            <SelectItem key={job.id} value={String(idx)}>
              {`Page ${idx + 1} — ${summarizeJob(job)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
