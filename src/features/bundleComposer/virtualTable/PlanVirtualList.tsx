import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef } from 'react';
import { useBundles } from '../../../lib/hooks/useBundles';
import { useBundlesByPlanIds } from '../../../lib/hooks/useBundlesByPlanId';
import { useChannels } from '../../../lib/hooks/useChannels';
import { useChannelsByPlanIds } from '../../../lib/hooks/useChannelsByPlanId';
import { type Bundle, type Channel, type Plan } from '../../../schema';
import { makeSelectDraftsForJob } from '../../updateEditor/selectors';
import {
  UpdateType,
  type PlanBundlesArgs,
  type PlanChannelsArgs,
  type PlanPropertiesArgs,
  type UpdateArgs,
  type UpdateJob,
} from '../../updateEditor/types';
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
  const args = (currentJob.args ?? {}) as UpdateArgs;
  const bundlesToAddByPlanId = useMemo(
    () => args.bundlesToAddByPlanId ?? {},
    [args.bundlesToAddByPlanId],
  );
  const bundlesToRemoveByPlanId = useMemo(
    () => args.bundlesToRemoveByPlanId ?? {},
    [args.bundlesToRemoveByPlanId],
  );
  const channelsToAddByPlanId = useMemo(
    () => args.channelsToAddByPlanId ?? {},
    [args.channelsToAddByPlanId],
  );
  const channelsToRemoveByPlanId = useMemo(
    () => args.channelsToRemoveByPlanId ?? {},
    [args.channelsToRemoveByPlanId],
  );
  const parentRef = useRef<HTMLDivElement>(null);

  const draftsForJob = useAppSelector(
    useMemo(() => makeSelectDraftsForJob(currentJob.id), [currentJob.id]),
  );

  const planIds = useMemo(() => plans.map((p) => p.id), [plans]);

  const planFieldDirty: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    const space = (draftsForJob?.plan ?? {}) as Record<string, object>;

    for (const [pid, patch] of Object.entries(space)) {
      out[pid] = new Set(Object.keys(patch));
    }

    return out;
  }, [draftsForJob?.plan]);

  const bundleFieldDirty: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    const space = (draftsForJob?.bundle ?? {}) as Record<string, object>;

    for (const [linkKey, patch] of Object.entries(space)) {
      out[linkKey] = new Set(Object.keys(patch));
    }

    return out;
  }, [draftsForJob?.bundle]);

  const channelFieldDirty: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    const space = (draftsForJob?.channel ?? {}) as Record<string, object>;

    for (const [cid, patch] of Object.entries(space)) {
      out[cid] = new Set(Object.keys(patch));
    }

    return out;
  }, [draftsForJob?.channel]);

  const catalogBundles = useBundles();
  const catalogChannels = useChannels();
  const planPatches: Record<string, Partial<Plan>> = useMemo(
    () => draftsForJob?.plan ?? {},
    [draftsForJob?.plan],
  );

  const { data: channelsByPlanId = {} } = useChannelsByPlanIds(planIds);
  const { data: bundlesByPlanId = {} } = useBundlesByPlanIds(planIds);

  const channelPatches: Record<string, Partial<Channel>> = useMemo(
    () => draftsForJob?.channel ?? {},
    [draftsForJob?.channel],
  );

  const bundlePatches: Record<string, Partial<Bundle>> = useMemo(
    () => draftsForJob?.bundle ?? {},
    [draftsForJob?.bundle],
  );

  const catalogBundlesById = useMemo(() => {
    const map: Record<string, Bundle> = {};

    for (const bundle of catalogBundles.data ?? []) {
      if (!map[bundle.id]) {
        map[bundle.id] = bundle;
      }
    }
    return map;
  }, [catalogBundles.data]);

  const catalogChannelsById = useMemo(() => {
    const map: Record<string, Channel> = {};
    for (const channel of catalogChannels.data ?? []) {
      if (!map[channel.id]) {
        map[channel.id] = channel;
      }
    }
    return map;
  }, [catalogChannels.data]);

  const mergedChannelsByPlanId = useMemo(() => {
    const out: Record<string, Channel[]> = {};

    for (const plan of plans) {
      const pid = plan.id;
      const baseList = (channelsByPlanId?.[pid] as unknown as Channel[] | undefined) ?? [];
      const removedIds = new Set(channelsToRemoveByPlanId[pid] ?? []);
      const addedIds = channelsToAddByPlanId[pid] ?? [];
      const seen = new Set<string>();

      const baseMerged: Channel[] = baseList
        .filter((channel) => {
          if (seen.has(channel.id)) return false;
          seen.add(channel.id);
          return true;
        })
        .map((channel, sortIndex) => {
          const linkKey = `${pid}:${channel.id}:${sortIndex}`;
          const patch = channelPatches[linkKey] ?? {};
          return { ...channel, ...patch };
        });

      const addedMerged: Channel[] = addedIds
        .filter((id) => !seen.has(id) && !removedIds.has(id))
        .map((channelId, idx) => {
          const sortIndex = baseMerged.length + idx;
          const linkKey = `${pid}:${channelId}:${sortIndex}`;
          const patch = channelPatches[linkKey] ?? {};
          const fromCatalog = catalogChannelsById[channelId];

          return {
            ...(fromCatalog ?? { id: channelId, name: `(New) ${channelId}` }),
            ...patch,
          } as Channel;
        });
      out[pid] = [...baseMerged, ...addedMerged];
    }
    return out;
  }, [
    plans,
    catalogChannelsById,
    channelsByPlanId,
    channelPatches,
    channelsToAddByPlanId,
    channelsToRemoveByPlanId,
  ]);

  const dirtyChannelsByPlanId = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};

    for (const [pid, list] of Object.entries(mergedChannelsByPlanId)) {
      const removedIds = new Set(channelsToRemoveByPlanId[pid] ?? []);
      const addedIds = new Set(channelsToAddByPlanId[pid] ?? []);

      out[pid] = Object.fromEntries(
        (list as Channel[]).map((channel, sortIndex) => {
          const linkKey = `${pid}:${channel.id}:${sortIndex}`;
          const isPatched = Boolean(channelPatches[linkKey]);
          const isRemoved = removedIds.has(channel.id);
          const isAdded = addedIds.has(channel.id);
          return [linkKey, isPatched || isRemoved || isAdded];
        }),
      );
    }
    return out;
  }, [mergedChannelsByPlanId, channelPatches, channelsToRemoveByPlanId, channelsToAddByPlanId]);

  const mergedBundlesByPlanId = useMemo(() => {
    const out: Record<string, Bundle[]> = {};

    for (const plan of plans) {
      const pid = plan.id;
      const baseList = (bundlesByPlanId?.[pid] as unknown as Bundle[] | undefined) ?? [];
      const removedIds = new Set(bundlesToRemoveByPlanId[pid] ?? []);
      const addedIds = bundlesToAddByPlanId[pid] ?? [];
      const seen = new Set<string>();

      const baseMerged: Bundle[] = baseList
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
      const addedMerged: Bundle[] = addedIds
        .filter((id) => !seen.has(id) && !removedIds.has(id))
        .map((bundleId, idx) => {
          const sortIndex = baseMerged.length + idx;
          const linkKey = `${pid}:${bundleId}:${sortIndex}`;
          const patch = bundlePatches[linkKey] ?? {};

          const fromCatalog = catalogBundlesById[bundleId];
          return {
            ...(fromCatalog ?? { id: bundleId, name: `(New) ${bundleId}` }),
            ...patch,
          } as Bundle;
        });

      out[pid] = [...baseMerged, ...addedMerged];
    }

    return out;
  }, [
    plans,
    catalogBundlesById,
    bundlesByPlanId,
    bundlePatches,
    bundlesToAddByPlanId,
    bundlesToRemoveByPlanId,
  ]);

  const dirtyBundlesByPlanId = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};

    for (const [pid, list] of Object.entries(mergedBundlesByPlanId)) {
      const removedIds = new Set(bundlesToRemoveByPlanId[pid] ?? []);
      const addedIds = new Set(bundlesToAddByPlanId[pid] ?? []);

      out[pid] = Object.fromEntries(
        (list as Bundle[]).map((bundle, sortIndex) => {
          const linkKey = `${pid}:${bundle.id}:${sortIndex}`;
          const isPatched = Boolean(bundlePatches[linkKey]);
          const isRemoved = removedIds.has(bundle.id);
          const isAdded = addedIds.has(bundle.id);
          return [linkKey, isPatched || isRemoved || isAdded];
        }),
      );
    }
    return out;
  }, [mergedBundlesByPlanId, bundlePatches, bundlesToRemoveByPlanId, bundlesToAddByPlanId]);

  const derivedFieldsToShow = useMemo(() => {
    if (fieldsToShow && fieldsToShow.length) return fieldsToShow;
    if (currentJob.type === UpdateType.PlanProperties) {
      const keys: string[] | undefined = (currentJob.args as PlanPropertiesArgs).planPropertyKeys;
      return keys && keys.length ? keys : undefined;
    }
    return undefined;
  }, [fieldsToShow, currentJob]);

  const derivedChannelFieldsToShow = useMemo(() => {
    if (fieldsToShow && fieldsToShow.length) return fieldsToShow;
    if (currentJob.type === UpdateType.PlanChannels) {
      const keys: string[] | undefined = (currentJob.args as PlanChannelsArgs).channelPropertyKeys;
      return keys && keys.length ? keys : undefined;
    }
    return undefined;
  }, [fieldsToShow, currentJob]);

  const derivedBundleFieldsToShow = useMemo(() => {
    if (fieldsToShow && fieldsToShow.length) return fieldsToShow;
    if (currentJob.type === UpdateType.PlanBundles) {
      const keys: string[] | undefined = (currentJob.args as PlanBundlesArgs).bundlePropertyKeys;
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
      console.warn('[PlanVirtualList] onChangePlan not provided. jobId:', currentJob.id);
    },
    [onChangePlan, currentJob],
  );

  const handleChangeBundle = useCallback(
    (linkKey: string, patch: Partial<Bundle>) => {
      if (onChangeBundle) return onChangeBundle(linkKey, patch, currentJob);
      console.warn('[PlanVirtualList] onChangeBundle not provided. jobId:', currentJob.id);
    },
    [onChangeBundle, currentJob],
  );

  const handleChangeChannel = useCallback(
    (channelId: string, patch: Partial<Channel>) => {
      if (onChangeChannel) return onChangeChannel(channelId, patch, currentJob);
      console.warn('[PlanVirtualList] onChangeChannel not provided. jobId:', currentJob.id);
    },
    [onChangeChannel, currentJob],
  );

  const handleDiscardPlan = useCallback(
    (planId: string) => {
      if (onDiscardPlan) return onDiscardPlan(planId, currentJob);
      console.warn('[PlanVirtualList] onDiscardPlan not provided. jobId:', currentJob.id);
    },
    [onDiscardPlan, currentJob],
  );

  const handleDiscardBundle = useCallback(
    (bundleId: string) => {
      if (onDiscardBundle) return onDiscardBundle(bundleId, currentJob);
      console.warn('[PlanVirtualList] onDiscardBundle not provided. jobId:', currentJob.id);
    },
    [onDiscardBundle, currentJob],
  );

  const handleDiscardChannel = useCallback(
    (channelId: string) => {
      if (onDiscardChannel) return onDiscardChannel(channelId, currentJob);
      console.warn('[PlanVirtualList] onDiscardChannel not provided. jobId:', currentJob.id);
    },
    [onDiscardChannel, currentJob],
  );

  const handleAddBundleToPlan = useCallback(
    (planId: string, bundleId: string) => {
      if (onAddBundleToPlan) return onAddBundleToPlan(planId, bundleId);
      console.warn('[PlanVirtualList] onAddBundleToPlan not provided. jobId:', currentJob.id);
    },
    [onAddBundleToPlan, currentJob],
  );

  const handleRemoveBundleFromPlan = useCallback(
    (planId: string, bundleId: string) => {
      if (onRemoveBundleFromPlan) return onRemoveBundleFromPlan(planId, bundleId);
      console.warn('[PlanVirtualList] onRemoveBundleFromPlan not provided. jobId:', currentJob.id);
    },
    [onRemoveBundleFromPlan, currentJob],
  );

  const handleAddChannelToPlan = useCallback(
    (planId: string, channelId: string) => {
      if (onAddChannelToPlan) return onAddChannelToPlan(planId, channelId);
      console.warn('[PlanVirtualList] onAddChannelToPlan not provided. jobId:', currentJob.id);
    },
    [onAddChannelToPlan, currentJob],
  );

  const handleRemoveChannelFromPlan = useCallback(
    (planId: string, channelId: string) => {
      if (onRemoveChannelFromPlan) return onRemoveChannelFromPlan(planId, channelId);
      console.warn('[PlanVirtualList] onRemoveChannelFromPlan not provided. jobId:', currentJob.id);
    },
    [onRemoveChannelFromPlan, currentJob],
  );

  const handleAddChannelToBundle = useCallback(
    (bundleLinkKey: string, channelId: string) => {
      if (onAddChannelToBundle) return onAddChannelToBundle(bundleLinkKey, channelId);
      console.warn('[PlanVirtualList] onAddChannelToBundle not provided. jobId:', currentJob.id);
    },
    [onAddChannelToBundle, currentJob],
  );

  const handleRemoveChannelFromBundle = useCallback(
    (bundleLinkKey: string, channelId: string) => {
      if (onRemoveChannelFromBundle) {
        return onRemoveChannelFromBundle(bundleLinkKey, channelId);
      }
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
          const basePlan = plans[v.index];
          const patch = planPatches[basePlan.id] ?? {};
          const dirty = Boolean(planPatches[basePlan.id]);

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
                jobId: currentJob.id,
                basePlan,
                mergedPlan: { ...basePlan, ...patch },
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
                    : currentJob.type === UpdateType.PlanBundles
                      ? derivedBundleFieldsToShow
                      : derivedFieldsToShow,
                channelsByPlanId: mergedChannelsByPlanId,
                baselineChannelsByPlanId: channelsByPlanId,
                dirtyChannelsByPlanId,
                bundlesByPlanId: mergedBundlesByPlanId,
                baselineBundlesByPlanId: bundlesByPlanId,
                dirtyBundlesByPlanId,
                planFieldDirty,
                bundleFieldDirty,
                channelFieldDirty,
                removedBundleIdsByPlanId: bundlesToRemoveByPlanId,
                addedBundleIdsByPlanId: bundlesToAddByPlanId,
                removedChannelIdsByPlanId: channelsToRemoveByPlanId,
                addedChannelIdsByPlanId: channelsToAddByPlanId,
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
