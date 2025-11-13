import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef } from 'react';
import { useSelectedPlansWithBundles } from '../../../features/updateEditor/hooks/useSelectedPlansWithBundles';
import { useSelectedPlansWithChannels } from '../../../features/updateEditor/hooks/useSelectedPlansWithChannels';
import { type Bundle, type Channel, type Plan } from '../../../schema';
import { makeSelectDraftsForJob } from '../../updateEditor/selectors';
import { UpdateType, type UpdateJob } from '../../updateEditor/types';
import { useAppSelector } from '../store/hooks';
import { renderEditorsForJob } from './utils/renderEditorsForJob';

interface Props {
  plans: Plan[];
  currentJob: UpdateJob;
  patchesForJob?: Record<string, Partial<Plan>>;
  onChangePlan?: (planId: string, patch: Partial<Plan>, job: UpdateJob) => void;
  onChangeBundle?: (bundleId: string, patch: Partial<Bundle>, job: UpdateJob) => void;
  onChangeChannel?: (channelId: string, patch: Partial<Channel>, job: UpdateJob) => void;
  onDiscardPlan?: (planId: string, job: UpdateJob) => void;
  onDiscardBundle?: (bundleId: string, job: UpdateJob) => void;
  onDiscardChannel?: (channelId: string, job: UpdateJob) => void;
  fieldsToShow?: string[];
}

export const PlanVirtualList = ({
  plans,
  currentJob,
  onChangePlan,
  onChangeBundle,
  onChangeChannel,
  onDiscardPlan,
  onDiscardBundle,
  onDiscardChannel,
  fieldsToShow,
}: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const draftsForJob = useAppSelector(
    useMemo(() => makeSelectDraftsForJob(currentJob.id), [currentJob.id]),
  );

  const planFieldDirty: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    const space = draftsForJob?.plan ?? {};
    for (const [pid, patch] of Object.entries(space)) {
      out[pid] = new Set(Object.keys(patch));
    }
    return out;
  }, [draftsForJob?.plan]);

  const channelFieldDirty: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    const space = draftsForJob?.channel ?? {};
    for (const [cid, patch] of Object.entries(space)) {
      out[cid] = new Set(Object.keys(patch));
    }
    return out;
  }, [draftsForJob?.channel]);

  const planPatches: Record<string, Partial<Plan>> = draftsForJob?.plan ?? {};
  const { channelsByPlanId } = useSelectedPlansWithChannels(plans.map((plan) => plan.id));

  const channelPatches: Record<string, Partial<Channel>> = draftsForJob?.channel ?? {};

  const { bundlesByPlanId } = useSelectedPlansWithBundles(plans.map((plan) => plan.id));

  const bundlePatches: Record<string, Partial<Bundle>> = draftsForJob?.bundle ?? {};

  // merge patches into the channels we render
  const mergedChannelsByPlanId = useMemo(() => {
    const out: Record<string, Channel[]> = {};
    for (const [pid, list] of Object.entries(channelsByPlanId ?? {})) {
      out[pid] = (list as Channel[]).map((ch) => ({
        ...ch,
        ...(channelPatches[ch.id] ?? {}),
      }));
    }
    return out;
  }, [channelsByPlanId, channelPatches]);

  // dirty map per plan -> { channelId: boolean }
  const dirtyChannelsByPlanId = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};
    for (const [pid, list] of Object.entries(channelsByPlanId ?? {})) {
      out[pid] = Object.fromEntries(
        (list as Channel[]).map((ch) => [ch.id, Boolean(channelPatches[ch.id])]),
      );
    }
    return out;
  }, [channelsByPlanId, channelPatches]);

  const mergedBundlesByPlanId = useMemo(() => {
    const out: Record<string, Bundle[]> = {};
    for (const [pid, list] of Object.entries(bundlesByPlanId ?? {})) {
      out[pid] = (list as unknown as Bundle[]).map((bundle) => ({
        ...bundle,
        ...(bundlePatches[bundle.id] ?? {}),
      }));
    }
    return out;
  }, [bundlesByPlanId, bundlePatches]);

  const dirtyBundlesByPlanId = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};
    for (const [pid, list] of Object.entries(bundlesByPlanId ?? {})) {
      out[pid] = Object.fromEntries(
        (list as unknown as Bundle[]).map((bundle) => [
          bundle.id,
          Boolean(bundlePatches[bundle.id]),
        ]),
      );
    }
    return out;
  }, [bundlesByPlanId, bundlePatches]);

  // derive fields when job is PlanProperties or PlanBundleProperties
  const derivedFieldsToShow = useMemo(() => {
    if (fieldsToShow && fieldsToShow.length) return fieldsToShow;
    if (currentJob.type === UpdateType.PlanProperties) {
      // @ts-expect-error
      const keys: string[] | undefined = currentJob.args.planPropertyKeys;
      return keys && keys.length ? keys : undefined;
    }
    return undefined;
  }, [fieldsToShow, currentJob]);

  const derivedChannelFieldsToShow = useMemo(() => {
    if (fieldsToShow && fieldsToShow.length) return fieldsToShow;
    if (currentJob.type === UpdateType.PlanChannels) {
      // @ts-expect-error
      const keys: string[] | undefined = currentJob.args.channelPropertyKeys;
      return keys && keys.length ? keys : undefined;
    }
    return undefined;
  }, [fieldsToShow, currentJob]);

  const rowVirtualizer = useVirtualizer({
    count: plans.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160,
    overscan: 6,
    getItemKey: (index) => plans[index]?.id ?? index,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  const handleChangePlan = useCallback(
    (planId: string, patch: Partial<Plan>) => {
      if (onChangePlan) return onChangePlan(planId, patch, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onChangePlan not provided. jobId:', currentJob.id);
    },
    [onChangePlan, currentJob],
  );

  const handleChangeBundle = useCallback(
    (planId: string, patch: Partial<Bundle>) => {
      if (onChangeBundle) return onChangeBundle(planId, patch, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onChangeBundle not provided. jobId:', currentJob.id);
    },
    [onChangePlan, currentJob],
  );

  const handleChangeChannel = useCallback(
    (channelId: string, patch: Partial<Channel>) => {
      console.log('channelId: ', channelId);
      if (onChangeChannel) return onChangeChannel(channelId, patch, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onChangeChannel not provided. jobId:', currentJob.id);
    },
    [onChangeChannel, currentJob],
  );

  const handleDiscardPlan = useCallback(
    (planId: string) => {
      console.log('We getting here?');
      if (onDiscardPlan) return onDiscardPlan(planId, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onDiscardPlan not provided. jobId:', currentJob.id);
    },
    [onDiscardPlan, currentJob],
  );

  const handleDiscardBundle = useCallback(
    (bundleId: string) => {
      if (onDiscardBundle) return onDiscardBundle(bundleId, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onDiscardPlan not provided. jobId:', currentJob.id);
    },
    [onDiscardBundle, currentJob],
  );

  const handleDiscardChannel = useCallback(
    (planId: string) => {
      if (onDiscardChannel) return onDiscardChannel(planId, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onDiscardPlan not provided. jobId:', currentJob.id);
    },
    [onDiscardChannel, currentJob],
  );

  const measureRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        rowVirtualizer.measureElement(el);
      }
    },
    [rowVirtualizer],
  );

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((v) => {
          const plan = plans[v.index];
          const patch = planPatches[plan.id] ?? {};
          const dirty = Boolean(planPatches[plan.id]);
          return (
            <div
              key={v.key}
              data-index={v.index}
              ref={measureRef}
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
                onChangeBundle: handleChangeBundle,
                onChangeChannel: handleChangeChannel,
                onDiscardPlan: handleDiscardPlan,
                onDiscardBundle: handleDiscardBundle,
                onDiscardChannel: handleDiscardChannel,
                fieldsToShow:
                  currentJob.type === UpdateType.PlanChannels
                    ? derivedChannelFieldsToShow
                    : derivedFieldsToShow,
                channelsByPlanId: mergedChannelsByPlanId,
                dirtyChannelsByPlanId: dirtyChannelsByPlanId,
                bundlesByPlanId: mergedBundlesByPlanId,
                dirtyBundlesByPlanId: dirtyBundlesByPlanId,
                planFieldDirty,
                channelFieldDirty,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
