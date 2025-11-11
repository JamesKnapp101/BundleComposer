import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import type { Plan } from 'src/schema';
import { useSelectedPlansQuery } from '../../../lib/hooks';
import { Button } from '../../../ui/inputs/Button';
import { clearAll, clearDraft, upsertDraft } from '../store/draftSlice';
import type { RootState } from '../store/store';
import { PlanVirtualList } from './PlanVirtualList';

export default function BundleComposerPage() {
  const [sp] = useSearchParams();
  const ids = useMemo(() => (sp.get('plans') ?? '').split(',').filter(Boolean), [sp]);

  const { plans } = useSelectedPlansQuery(ids);
  const dispatch = useDispatch();
  const patches = useSelector((s: RootState) => s.drafts.plan);

  const dirtyIds = useMemo(
    () => plans.map((p) => p.id).filter((id) => Boolean(patches[id])),
    [plans, patches],
  );

  const onChangePlan = useCallback(
    (id: string, patch: Partial<Plan>) =>
      dispatch(
        upsertDraft({
          id,
          patch,
          type: 'plan',
        }),
      ),
    [dispatch],
  );

  const onDiscard = useCallback(
    (id: string) =>
      dispatch(
        clearDraft({
          id,
          type: 'plan',
        }),
      ),
    [dispatch],
  );

  const discardAll = useCallback(() => {
    if (!dirtyIds.length) return;
    dispatch(clearAll());
  }, [dispatch, dirtyIds]);

  const saveAll = useCallback(async () => {
    // TODO: call your API to persist changes; for demo just clear
    // await api.savePlans(dirtyIds.map(id => ({ id, ...patches[id] })));
    // dispatch(clearMany(dirtyIds));
  }, [dispatch, dirtyIds /*, patches*/]);

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 backdrop-blur px-4 py-2">
        <h1 className="text-lg font-semibold">Bundle Composer</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{dirtyIds.length} dirty</span>
          <Button variant="outline" onClick={discardAll} disabled={!dirtyIds.length}>
            Discard
          </Button>
          <Button onClick={saveAll} disabled={!dirtyIds.length}>
            Save
          </Button>
        </div>
      </header>

      <PlanVirtualList
        plans={plans}
        patches={patches}
        onChangePlan={onChangePlan}
        onDiscard={onDiscard}
      />
    </div>
  );
}
