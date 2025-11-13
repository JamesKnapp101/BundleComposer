import { UpdateType, type RenderArgs } from '../../../../features/updateEditor/types';
import { BundleSchema, ChannelSchema, PlanSchema } from '../../../../schema';
import { PlanBundlesRowCard } from '../editors/PlanBundlesRowCard';
import { PlanChannelsRowCard } from '../editors/PlanChannelsRowCard';
import { PlanRowCard } from '../editors/PlanRowCard';

export const renderEditorsForJob = ({
  job,
  plan,
  mergedPlan,
  dirty,
  onChangePlan,
  onChangeBundle,
  onChangeChannel,
  onDiscardPlan,
  onDiscardBundle,
  onDiscardChannel,
  fieldsToShow,
  bundlesByPlanId,
  dirtyBundlesByPlanId,
  channelsByPlanId,
  dirtyChannelsByPlanId,
  planFieldDirty,
  bundleFieldDirty,
  channelFieldDirty,
}: RenderArgs) => {
  switch (job.type) {
    case UpdateType.PlanProperties:
      return (
        <PlanRowCard
          plan={mergedPlan}
          dirty={dirty}
          planFieldDirty={planFieldDirty ?? {}}
          fieldsToShow={fieldsToShow ?? (PlanSchema.keyof().options as string[])}
          onChange={(patch) => onChangePlan(plan.id, patch)}
          onDiscard={() => onDiscardPlan(plan.id)}
        />
      );
    case UpdateType.PlanChannels: {
      const channels = channelsByPlanId?.[plan.id] ?? [];
      const dirtyChannels = dirtyChannelsByPlanId?.[plan.id] ?? {};

      return (
        <PlanChannelsRowCard
          plan={mergedPlan}
          channels={channels}
          channelFieldsToShow={(fieldsToShow ?? (ChannelSchema.keyof().options as string[])).filter(
            (k) => k !== 'id',
          )}
          channelFieldDirty={channelFieldDirty ?? {}}
          dirtyChannels={dirtyChannels}
          onChangeChannel={(channelId, patch) => {
            if ('id' in patch) delete (patch as any).id;
            onChangeChannel(channelId, patch);
          }}
          onDiscardPlan={() => onDiscardPlan(plan.id)}
          onDiscardChannel={onDiscardChannel}
        />
      );
    }
    case UpdateType.PlanBundles:
      const bundles = bundlesByPlanId?.[plan.id] ?? [];
      const dirtyBundles = dirtyBundlesByPlanId?.[plan.id] ?? {};
      return (
        <PlanBundlesRowCard
          plan={mergedPlan}
          bundles={bundles}
          bundleFieldsToShow={(fieldsToShow ?? (BundleSchema.keyof().options as string[])).filter(
            (k) => k !== 'id',
          )}
          bundleFieldDirty={bundleFieldDirty ?? {}}
          dirtyBundles={dirtyBundles}
          onChangeBundle={(bundleId, patch) => {
            if ('id' in patch) delete (patch as any).id;
            onChangeBundle(bundleId, patch);
          }}
          onDiscardPlan={() => onDiscardPlan(plan.id)}
          onDiscardBundle={onDiscardBundle}
        />
      );

    case UpdateType.PlanBundleProperties:
      return (
        <div className="relative isolate my-2 mx-2 rounded-xl border bg-white p-3 shadow-sm">
          <div className="text-sm font-medium">Bundle properties editor coming soon</div>
          <div className="text-xs text-slate-600">Plan: {plan.name}</div>
        </div>
      );

    default:
      return null;
  }
};
