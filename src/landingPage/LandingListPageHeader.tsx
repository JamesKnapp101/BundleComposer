import type { Plan } from '@schema';
import { LayoutList, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils/cn';

type LandingListPageHeaderProps = { selectedRows: Plan[] };

const LandingListPageHeader = ({ selectedRows }: LandingListPageHeaderProps) => {
  const selectedIds = selectedRows.map((p) => p.id);
  const navigate = useNavigate();

  const launchBundleComposer = () => {
    navigate({
      pathname: '/bundle-composer',
      search: `?${new URLSearchParams({ plans: selectedIds.join(',') })}`,
    });
  };

  return (
    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
      <div className="col-span-8 flex items-center">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
          <LayoutList className="h-5 w-5 text-slate-700" />
        </span>
        <span className="ml-3 text-xl font-semibold text-slate-900">Plans</span>
        <span className="ml-3 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
          {selectedIds.length} {'selected'}
        </span>
      </div>
      <div className="col-span-4 flex items-center justify-start sm:justify-end gap-2">
        <button
          type="button"
          onClick={launchBundleComposer}
          disabled={selectedIds.length === 0}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
            'shadow-sm ring-1 ring-inset',
            selectedIds.length === 0
              ? 'bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed'
              : 'bg-indigo-600 text-white ring-indigo-600 hover:bg-indigo-500',
          )}
        >
          <>
            <Play className="h-4 w-4" />
            {'Bundle Composer'}
          </>
        </button>
      </div>
    </div>
  );
};

export default LandingListPageHeader;
