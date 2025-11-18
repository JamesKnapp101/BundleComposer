import { cn } from '@lib/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { UpdateType, type UpdateJob } from '../types';
import { labelForType } from '../utils/labelForType';

export interface PagePickerProps {
  jobs: UpdateJob[];
  current: number; // currentJobIndex
  onChange: (nextIndex: number) => void;
  onSubmitWithValidation: () => Promise<boolean>;
  className?: string;
  'data-testid'?: string;
}

const summarizeJob = (job: UpdateJob): string => {
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
};

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

        <SelectContent
          position="popper"
          side="bottom"
          align="start"
          sideOffset={4}
          className={cn(
            'z-[9999] min-w-[280px] overflow-hidden cursor-default',
            'rounded-lg border border-slate-200 bg-white shadow-lg',
          )}
        >
          <div className="max-h-64 overflow-auto py-1 px-1">
            {jobs.map((job, idx) => (
              <SelectItem
                key={job.id}
                value={String(idx)}
                className={cn(
                  'flex w-full items-center rounded-md px-2 py-1.5 text-sm',
                  'cursor-pointer select-none outline-none transition-colors',
                  'text-slate-700',
                  'hover:bg-slate-100 hover:text-slate-900',
                  'data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900',
                )}
              >
                {`Page ${idx + 1} — ${summarizeJob(job)}`}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
