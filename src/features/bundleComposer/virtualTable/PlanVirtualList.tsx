import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef } from 'react';
import { useSelectedPlansWithBundles } from '../../../features/updateEditor/hooks/useSelectedPlansWithBundles';
import { useSelectedPlansWithChannels } from '../../../features/updateEditor/hooks/useSelectedPlansWithChannels';
import { type Bundle, type Channel, type Plan } from '../../../schema';
import { makeSelectDraftsForJob } from '../../updateEditor/selectors';
import { UpdateType, type UpdateArgs, type UpdateJob } from '../../updateEditor/types';
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

  onAddBundleToPlan?: (planId: string, bundleId: string) => void;
  onRemoveBundleFromPlan?: (planId: string, bundleId: string) => void;

  onAddChannelToPlan?: (planId: string, channelId: string) => void;
  onRemoveChannelFromPlan?: (planId: string, channelId: string) => void;

  onAddChannelToBundle?: (bundleLinkKey: string, channelId: string) => void;
  onRemoveChannelFromBundle?: (bundleLinkKey: string, channelId: string) => void;

  onOpenBundlePicker?: (planId: string) => void;
  onOpenChannelPicker?: (planId: string) => void;

  fieldsToShow?: string[];
}
type PlanBundlesJobArgs = Extract<UpdateArgs, { type: typeof UpdateType.PlanBundles }>;
type PlanChannelsJobArgs = Extract<UpdateArgs, { type: typeof UpdateType.PlanChannels }>;

export const PlanVirtualList = ({
  plans,
  currentJob,
  onChangePlan,
  onChangeBundle,
  onChangeChannel,
  onDiscardPlan,
  onDiscardBundle,
  onDiscardChannel,
  onAddBundleToPlan,
  onRemoveBundleFromPlan,
  onAddChannelToPlan,
  onRemoveChannelFromPlan,
  onAddChannelToBundle,
  onRemoveChannelFromBundle,
  onOpenBundlePicker,
  onOpenChannelPicker,
  fieldsToShow,
}: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);
  console.log('Is it getting here? ', onAddBundleToPlan);

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

  const bundleFieldDirty: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    const space = draftsForJob?.bundle ?? {};
    for (const [linkKey, patch] of Object.entries(space)) {
      out[linkKey] = new Set(Object.keys(patch));
    }
    return out;
  }, [draftsForJob?.bundle]);

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

  const planBundlesArgs: PlanBundlesJobArgs | undefined =
    currentJob.type === UpdateType.PlanBundles
      ? (currentJob.args as PlanBundlesJobArgs)
      : undefined;

  const planChannelsArgs: PlanChannelsJobArgs | undefined =
    currentJob.type === UpdateType.PlanChannels
      ? (currentJob.args as PlanChannelsJobArgs)
      : undefined;

  const removedBundleIdsByPlanId: Record<string, string[]> =
    planBundlesArgs?.bundlesToRemoveByPlanId ?? {};

  const removedChannelIdsByPlanId: Record<string, string[]> =
    planChannelsArgs?.channelsToRemoveByPlanId ?? {};

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

  const channelsToRemoveByPlanId = planChannelsArgs?.channelsToRemoveByPlanId ?? {};

  const dirtyChannelsByPlanId = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};

    for (const [pid, list] of Object.entries(mergedChannelsByPlanId)) {
      const removedIds = new Set(removedChannelIdsByPlanId[pid] ?? []);

      out[pid] = Object.fromEntries(
        (list as Channel[]).map((ch) => {
          const isPatched = Boolean(channelPatches[ch.id]);
          const isRemoved = removedIds.has(ch.id);
          return [ch.id, isPatched || isRemoved];
        }),
      );
    }

    return out;
  }, [mergedChannelsByPlanId, channelPatches, removedChannelIdsByPlanId]);

  const mergedBundlesByPlanId = useMemo(() => {
    const out: Record<string, Bundle[]> = {};

    for (const [pid, list] of Object.entries(bundlesByPlanId ?? {})) {
      const seen = new Set<string>();

      out[pid] = (list as unknown as Bundle[])
        // dedupe by bundle.id per plan
        .filter((bundle) => {
          if (seen.has(bundle.id)) return false;
          seen.add(bundle.id);
          return true;
        })
        .map((bundle, sortIndex) => {
          const linkKey = `${pid}:${bundle.id}:${sortIndex}`;
          const patch = bundlePatches[linkKey] ?? {};
          return { ...bundle, ...patch };
        });
    }

    return out;
  }, [bundlesByPlanId, bundlePatches]);

  const dirtyBundlesByPlanId = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};

    for (const [pid, list] of Object.entries(mergedBundlesByPlanId)) {
      const removedIds = new Set(removedBundleIdsByPlanId[pid] ?? []);

      out[pid] = Object.fromEntries(
        (list as Bundle[]).map((bundle, sortIndex) => {
          const linkKey = `${pid}:${bundle.id}:${sortIndex}`;
          const isPatched = Boolean(bundlePatches[linkKey]);
          const isRemoved = removedIds.has(bundle.id);
          return [linkKey, isPatched || isRemoved];
        }),
      );
    }

    return out;
  }, [mergedBundlesByPlanId, bundlePatches, removedBundleIdsByPlanId]);

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
    (linkKey: string, patch: Partial<Bundle>) => {
      if (onChangeBundle) return onChangeBundle(linkKey, patch, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onChangeBundle not provided. jobId:', currentJob.id);
    },
    [onChangeBundle, currentJob],
  );

  const handleChangeChannel = useCallback(
    (channelId: string, patch: Partial<Channel>) => {
      if (onChangeChannel) return onChangeChannel(channelId, patch, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onChangeChannel not provided. jobId:', currentJob.id);
    },
    [onChangeChannel, currentJob],
  );

  const handleDiscardPlan = useCallback(
    (planId: string) => {
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
      console.warn('[PlanVirtualList] onDiscardBundle not provided. jobId:', currentJob.id);
    },
    [onDiscardBundle, currentJob],
  );

  const handleDiscardChannel = useCallback(
    (channelId: string) => {
      if (onDiscardChannel) return onDiscardChannel(channelId, currentJob);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onDiscardChannel not provided. jobId:', currentJob.id);
    },
    [onDiscardChannel, currentJob],
  );

  // NEW: add/remove actions (plan-level / bundle-level / channel-level)
  const handleAddBundleToPlan = useCallback(
    (planId: string, bundleId: string) => {
      if (onAddBundleToPlan) return onAddBundleToPlan(planId, bundleId);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onAddBundleToPlan not provided. jobId:', currentJob.id);
    },
    [onAddBundleToPlan, currentJob],
  );

  const handleRemoveBundleFromPlan = useCallback(
    (planId: string, bundleId: string) => {
      if (onRemoveBundleFromPlan) return onRemoveBundleFromPlan(planId, bundleId);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onRemoveBundleFromPlan not provided. jobId:', currentJob.id);
    },
    [onRemoveBundleFromPlan, currentJob],
  );

  const handleAddChannelToPlan = useCallback(
    (planId: string, channelId: string) => {
      if (onAddChannelToPlan) return onAddChannelToPlan(planId, channelId);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onAddChannelToPlan not provided. jobId:', currentJob.id);
    },
    [onAddChannelToPlan, currentJob],
  );

  const handleRemoveChannelFromPlan = useCallback(
    (planId: string, channelId: string) => {
      if (onRemoveChannelFromPlan) return onRemoveChannelFromPlan(planId, channelId);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onRemoveChannelFromPlan not provided. jobId:', currentJob.id);
    },
    [onRemoveChannelFromPlan, currentJob],
  );

  const handleAddChannelToBundle = useCallback(
    (bundleLinkKey: string, channelId: string) => {
      if (onAddChannelToBundle) return onAddChannelToBundle(bundleLinkKey, channelId);
      // eslint-disable-next-line no-console
      console.warn('[PlanVirtualList] onAddChannelToBundle not provided. jobId:', currentJob.id);
    },
    [onAddChannelToBundle, currentJob],
  );

  const handleRemoveChannelFromBundle = useCallback(
    (bundleLinkKey: string, channelId: string) => {
      if (onRemoveChannelFromBundle) {
        return onRemoveChannelFromBundle(bundleLinkKey, channelId);
      }
      // eslint-disable-next-line no-console
      console.warn(
        '[PlanVirtualList] onRemoveChannelFromBundle not provided. jobId:',
        currentJob.id,
      );
    },
    [onRemoveChannelFromBundle, currentJob],
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
                onAddBundleToPlan: handleAddBundleToPlan,
                onRemoveBundleFromPlan: handleRemoveBundleFromPlan,
                onAddChannelToPlan: handleAddChannelToPlan,
                onRemoveChannelFromPlan: handleRemoveChannelFromPlan,
                onAddChannelToBundle: handleAddChannelToBundle,
                onRemoveChannelFromBundle: handleRemoveChannelFromBundle,
                fieldsToShow:
                  currentJob.type === UpdateType.PlanChannels
                    ? derivedChannelFieldsToShow
                    : derivedFieldsToShow,
                channelsByPlanId: mergedChannelsByPlanId,
                dirtyChannelsByPlanId: dirtyChannelsByPlanId,
                bundlesByPlanId: mergedBundlesByPlanId,
                dirtyBundlesByPlanId: dirtyBundlesByPlanId,
                planFieldDirty,
                bundleFieldDirty,
                channelFieldDirty,
                removedBundleIdsByPlanId,
                removedChannelIdsByPlanId,
                onOpenBundlePicker,
                onOpenChannelPicker,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
