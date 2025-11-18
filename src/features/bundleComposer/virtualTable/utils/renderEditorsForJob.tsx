import { UpdateType, type RenderArgs } from '@features/updateEditor/types';
import { BundleSchema, ChannelSchema, PlanSchema, type Bundle, type Channel } from '@schema';
import { PlanBundlesRowCard } from '../editors/PlanBundlesRowCard';
import { PlanChannelsRowCard } from '../editors/PlanChannelsRowCard';
import { PlanRowCard } from '../editors/PlanRowCard';

export const renderEditorsForJob = ({
  job,
  jobId,
  basePlan,
  mergedPlan,
  dirty,
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
  fieldsToShow,
  bundlesByPlanId,
  baselineBundlesByPlanId,
  dirtyBundlesByPlanId,
  channelsByPlanId,
  baselineChannelsByPlanId,
  dirtyChannelsByPlanId,
  planFieldDirty,
  bundleFieldDirty,
  channelFieldDirty,
  removedChannelIdsByPlanId,
  addedChannelIdsByPlanId,
  removedBundleIdsByPlanId,
  addedBundleIdsByPlanId,
  onOpenBundlePicker,
  onOpenChannelPicker,
}: RenderArgs) => {
  switch (job.type) {
    case UpdateType.PlanProperties:
      return (
        <PlanRowCard
          jobId={jobId}
          mergedPlan={mergedPlan}
          originalPlan={basePlan}
          dirty={dirty}
          planFieldDirty={planFieldDirty ?? {}}
          fieldsToShow={fieldsToShow ?? (PlanSchema.keyof().options as string[])}
          onChange={(patch) => onChangePlan(mergedPlan.id, patch)}
          onDiscard={() => onDiscardPlan(mergedPlan.id)}
        />
      );
    case UpdateType.PlanChannels: {
      const channels = channelsByPlanId?.[mergedPlan.id];
      const dirtyChannels = dirtyChannelsByPlanId?.[mergedPlan.id];

      return (
        <PlanChannelsRowCard
          jobId={jobId}
          plan={mergedPlan}
          channels={channels ?? []}
          baselineChannels={
            (baselineChannelsByPlanId?.[mergedPlan.id] as Channel[] | undefined) ?? []
          }
          channelFieldsToShow={(fieldsToShow ?? (ChannelSchema.keyof().options as string[])).filter(
            (k) => k !== 'id',
          )}
          channelFieldDirty={channelFieldDirty ?? {}}
          dirtyChannels={dirtyChannels}
          onChangeChannel={(channelId, patch) => {
            if ('id' in patch) delete (patch as Partial<Channel>).id;
            onChangeChannel(channelId, patch);
          }}
          onDiscardPlan={() => onDiscardPlan(mergedPlan.id)}
          onDiscardChannel={onDiscardChannel}
          onAddChannelToPlan={onAddChannelToPlan}
          onRemoveChannelFromPlan={onRemoveChannelFromPlan}
          removedChannelIdsByPlanId={removedChannelIdsByPlanId}
          addedChannelIdsByPlanId={addedChannelIdsByPlanId}
          onOpenChannelPicker={onOpenChannelPicker}
        />
      );
    }
    case UpdateType.PlanBundles: {
      const bundles = bundlesByPlanId?.[mergedPlan.id];
      const dirtyBundles = dirtyBundlesByPlanId?.[mergedPlan.id];

      return (
        <PlanBundlesRowCard
          jobId={jobId}
          mergedPlan={mergedPlan}
          bundles={bundles ?? []}
          baselineBundles={(baselineBundlesByPlanId?.[mergedPlan.id] as Bundle[] | undefined) ?? []}
          bundleFieldsToShow={(fieldsToShow ?? (BundleSchema.keyof().options as string[])).filter(
            (k) => k !== 'id',
          )}
          bundleFieldDirty={bundleFieldDirty ?? {}}
          dirtyBundles={dirtyBundles}
          onChangeBundle={(bundleId, patch) => {
            if ('id' in patch) delete (patch as Partial<Bundle>).id;
            onChangeBundle(bundleId, patch);
          }}
          onDiscardPlan={() => onDiscardPlan(mergedPlan.id)}
          onDiscardBundle={onDiscardBundle}
          onAddBundleToPlan={onAddBundleToPlan}
          onRemoveBundleFromPlan={onRemoveBundleFromPlan}
          removedBundleIdsByPlanId={removedBundleIdsByPlanId}
          addedBundleIdsByPlanId={addedBundleIdsByPlanId}
          onOpenBundlePicker={onOpenBundlePicker}
        />
      );
    }
    case UpdateType.PlanBundleProperties:
      return (
        <div className="relative isolate my-2 mx-2 rounded-xl border bg-white p-3 shadow-sm">
          <div className="text-sm font-medium">Bundle properties editor coming soon</div>
          <div className="text-xs text-slate-600">Plan: {mergedPlan.name}</div>
        </div>
      );

    default:
      return null;
  }
};
