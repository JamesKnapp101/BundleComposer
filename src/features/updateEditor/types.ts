import type { Channel as AppChannel, Bundle, Channel, Plan } from '@schema';

type ChannelEditable = Omit<AppChannel, 'id'>;
export type ChannelPatch = Partial<ChannelEditable>;
export type ChannelKey = keyof ChannelEditable;
export const ENTITY_TYPES = ['plan', 'bundle', 'channel'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];
export type EditorPhase = 'select' | 'configure' | 'edit' | 'submitted';
export const UpdateType = {
  PlanProperties: 'plan-properties',
  PlanChannels: 'plan-channels',
  PlanBundles: 'plan-bundles',
  PlanBundleProperties: 'plan-bundle-properties',
} as const;
export type UpdateType = (typeof UpdateType)[keyof typeof UpdateType];

export type RelationshipDiffs = {
  bundlesToAddByPlanId?: Record<string, string[]>;
  bundlesToRemoveByPlanId?: Record<string, string[]>;
  channelsToAddByPlanId?: Record<string, string[]>;
  channelsToRemoveByPlanId?: Record<string, string[]>;
  channelsToAddByBundleKey?: Record<string, string[]>;
  channelsToRemoveByBundleKey?: Record<string, string[]>;
};

export type PlanPropertiesArgs = {
  type: typeof UpdateType.PlanProperties;
  planPropertyKeys?: string[];
};

export type PlanChannelsArgs = {
  type: typeof UpdateType.PlanChannels;
  channelPropertyKeys?: string[];
  channelIds?: string[];
  scope?: 'all' | 'local' | 'non-local';
};

export type PlanBundlesArgs = {
  type: typeof UpdateType.PlanBundles;
  bundlePropertyKeys?: string[];
  bundleIds?: string[];
  mode?: 'add' | 'remove' | 'edit';
};

type PlanBundlePropertiesArgs = {
  type: typeof UpdateType.PlanBundleProperties;
  bundleIds?: string[];
  propertyKeys?: string[];
};

export type UpdateArgs =
  | (PlanPropertiesArgs & RelationshipDiffs)
  | (PlanChannelsArgs & RelationshipDiffs)
  | (PlanBundlesArgs & RelationshipDiffs)
  | (PlanBundlePropertiesArgs & RelationshipDiffs);

export interface UpdateJob {
  id: string;
  type: UpdateType;
  args: UpdateArgs;
  planIds: string[];
  status: 'draft' | 'ready' | 'submitted';
  createdAt: number;
  dirty?: boolean;
}
export type DraftPatch<T> = Partial<T>;

export interface DraftsState {
  plan: Record<string, DraftPatch<Plan>>;
  bundle: Record<string, DraftPatch<Bundle>>;
  channel: Record<string, DraftPatch<Channel>>;
  byJobId: DraftsByJob;
}

export interface EditorState {
  jobs: UpdateJob[];
  currentJobIndex: number;
  drafts: DraftsState;
}

export type EntityPatchMap<T> = Record<string, DraftPatch<T>>;

export type DraftSpace = {
  plan: EntityPatchMap<Plan>;
  bundle: EntityPatchMap<Bundle>;
  channel: EntityPatchMap<Channel>;
};

export type DraftsByJob = Record<string, DraftSpace>;

export type RenderArgs = {
  job: UpdateJob;
  jobId: string;
  basePlan: Plan;
  mergedPlan: Plan & Record<string, unknown>;
  dirty: boolean;
  onChangePlan: (planId: string, patch: Partial<Plan>) => void;
  onChangeBundle: (linkKey: string, patch: Partial<Bundle>) => void;
  onChangeChannel: (channelId: string, patch: Partial<Channel>) => void;
  onDiscardPlan: (planId: string) => void;
  onDiscardBundle: (linkKey: string) => void;
  onDiscardChannel: (channelId: string) => void;
  onAddBundleToPlan: (planId: string, bundleId: string) => void;
  onRemoveBundleFromPlan: (planId: string, bundleId: string) => void;
  onAddChannelToPlan: (planId: string, channelId: string) => void;
  onRemoveChannelFromPlan: (planId: string, channelId: string) => void;
  onAddChannelToBundle: (bundleLinkKey: string, channelId: string) => void;
  onRemoveChannelFromBundle: (bundleLinkKey: string, channelId: string) => void;
  onOpenBundlePicker?: (planId: string) => void;
  onOpenChannelPicker?: (planId: string) => void;
  fieldsToShow?: string[];
  bundlesByPlanId?: Record<string, Bundle[]>;
  baselineBundlesByPlanId?: Record<string, Bundle[]>;
  dirtyBundlesByPlanId?: Record<string, Record<string, boolean>>;
  channelsByPlanId?: Record<string, Channel[]>;
  baselineChannelsByPlanId?: Record<string, Channel[]>;
  dirtyChannelsByPlanId?: Record<string, Record<string, boolean>>;
  planFieldDirty?: Record<string, Set<string>>;
  bundleFieldDirty?: Record<string, Set<string>>;
  channelFieldDirty?: Record<string, Set<string>>;
  removedBundleIdsByPlanId?: Record<string, string[]>;
  removedChannelIdsByPlanId?: Record<string, string[]>;
  addedBundleIdsByPlanId?: Record<string, string[]>;
  addedChannelIdsByPlanId?: Record<string, string[]>;
};

export type Job = {
  id: string;
  type: UpdateType;
  args: UpdateArgs;
};

export type PlanBundleList = Array<{
  plan: Plan;
  bundles: Bundle[];
  dirtyBundles?: Record<string, boolean>;
  removedBundleIds?: string[];
}>;

export type UpsertPlanFieldPayload<K extends keyof Plan = keyof Plan> = {
  jobId: string;
  id: string;
  field: K;
  value: Plan[K];
  original: Plan[K];
};
