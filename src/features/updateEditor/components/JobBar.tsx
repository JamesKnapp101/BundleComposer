import * as React from 'react';
import { type Job } from '../types';
import { labelForType } from '../utils/labelForType';
import { summarizeArgs } from '../utils/summarizeArgs';

interface Props {
  job: Job;
  onChange: () => void;
  isDirty?: boolean;
  rightExtra?: React.ReactNode;
}

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
          {'Change…'}
        </button>
      </div>
    </div>
  );
};
