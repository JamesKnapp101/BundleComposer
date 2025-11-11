import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import type { Plan } from 'src/schema';
import { makeSelectDraftsForJob } from '../../../features/updateEditor/selectors';
import type { UpdateJob } from '../../../features/updateEditor/types';
import { UpdateType } from '../../../features/updateEditor/types';
import { useAppSelector } from '../store/hooks';
import { PlanRowCard } from './PlanRowCard';

type Props = {
  plans: Plan[];
  currentJob: UpdateJob;

  /**
   * Optional: override the plan patches used for rendering.
   * If omitted, patches are taken from the store: drafts.byJobId[currentJob.id].plan
   */
  patchesForJob?: Record<string, Partial<Plan>>;

  /**
   * Optional: handle patch/discard externally (e.g., dispatch actions in parent).
   * If omitted, this component will no-op (and log a warning) when users edit/discard.
   */
  onChangePlan?: (planId: string, patch: Partial<Plan>, job: UpdateJob) => void;
  onDiscardPlan?: (planId: string, job: UpdateJob) => void;

  /**
   * Optional: restrict which property keys to render (if your PlanRowCard supports it).
   * If omitted and job is Plan Properties, the component will try to use job.args.planPropertyKeys.
   */
  fieldsToShow?: string[];
};

export function PlanVirtualList({
  plans,
  currentJob,
  patchesForJob,
  onChangePlan,
  onDiscardPlan,
  fieldsToShow,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  // pull the draft space for this job from the store
  const draftsForJob = useAppSelector(
    useMemo(() => makeSelectDraftsForJob(currentJob.id), [currentJob.id]),
  );

  // final patches map to use (prop override > store)
  const planPatches: Record<string, Partial<Plan>> = patchesForJob ?? draftsForJob?.plan ?? {};

  // If this is a Plan Properties job and caller didn't provide fieldsToShow,
  // derive from job args (optional)
  const derivedFieldsToShow = useMemo(() => {
    if (fieldsToShow && fieldsToShow.length) return fieldsToShow;
    if (currentJob.type === UpdateType.PlanProperties) {
      // @ts-expect-error - type narrows inside union, but keep safe
      const keys: string[] | undefined = currentJob.args.planPropertyKeys;
      return keys && keys.length ? keys : undefined;
    }
    return undefined;
  }, [fieldsToShow, currentJob]);

  const rowVirtualizer = useVirtualizer({
    count: plans.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // rough average row height
    overscan: 6,
  });

  // local wrappers: prefer parent callbacks, otherwise no-op with warning
  const handleChangePlan = (planId: string, patch: Partial<Plan>) => {
    if (onChangePlan) return onChangePlan(planId, patch, currentJob);
    // eslint-disable-next-line no-console
    console.warn(
      '[PlanVirtualList] onChangePlan not provided. Provide this prop to persist patches for jobId:',
      currentJob.id,
    );
  };

  const handleDiscardPlan = (planId: string) => {
    if (onDiscardPlan) return onDiscardPlan(planId, currentJob);
    // eslint-disable-next-line no-console
    console.warn(
      '[PlanVirtualList] onDiscardPlan not provided. Provide this prop to clear patches for jobId:',
      currentJob.id,
    );
  };

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div style={{ height: rowVirtualizer.getTotalSize() + 15, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((v) => {
          const plan = plans[v.index];
          const patch = planPatches[plan.id] ?? {};
          const dirty = Boolean(planPatches[plan.id]);

          return (
            <div
              key={plan.id}
              data-index={v.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${v.start}px)`,
              }}
            >
              {renderEditorsForJob({
                job: currentJob,
                plan,
                mergedPlan: { ...plan, ...patch },
                dirty,
                onChangePlan: handleChangePlan,
                onDiscardPlan: handleDiscardPlan,
                fieldsToShow: derivedFieldsToShow,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

type RenderArgs = {
  job: UpdateJob;
  plan: Plan;
  mergedPlan: Plan & Record<string, unknown>;
  dirty: boolean;
  onChangePlan: (planId: string, patch: Partial<Plan>) => void;
  onDiscardPlan: (planId: string) => void;
  fieldsToShow?: string[];
};

function renderEditorsForJob({
  job,
  plan,
  mergedPlan,
  dirty,
  onChangePlan,
  onDiscardPlan,
  fieldsToShow,
}: RenderArgs) {
  switch (job.type) {
    case UpdateType.PlanProperties:
      // Reuse your existing PlanRowCard for properties
      return (
        <PlanRowCard
          plan={mergedPlan}
          dirty={dirty}
          // If your card supports it, pass fieldsToShow to limit visible editors
          // fieldsToShow={fieldsToShow}
          onChange={(patch) => onChangePlan(plan.id, patch)}
          onDiscard={() => onDiscardPlan(plan.id)}
        />
      );

    case UpdateType.PlanChannels:
      // TODO: replace with a real per-plan channels editor
      return (
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm font-medium">Channels editor coming soon</div>
          <div className="text-xs text-slate-600">Plan: {plan.name}</div>
        </div>
      );

    case UpdateType.PlanBundles:
      // TODO: replace with a real per-plan bundles editor
      return (
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm font-medium">Bundles editor coming soon</div>
          <div className="text-xs text-slate-600">Plan: {plan.name}</div>
        </div>
      );

    case UpdateType.PlanBundleProperties:
      // TODO: replace with a real bundle properties editor
      return (
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm font-medium">Bundle properties editor coming soon</div>
          <div className="text-xs text-slate-600">Plan: {plan.name}</div>
        </div>
      );

    default:
      return null;
  }
}
