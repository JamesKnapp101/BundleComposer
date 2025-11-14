import type { Channel as AppChannel, Bundle, Channel, Plan } from 'src/schema';

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

// ---- UpdateArgs & UpdateJob ---------------------------------------------

export type RelationshipDiffs = {
  // plan <-> bundle
  bundlesToAddByPlanId?: Record<string, string[]>; // planId -> bundleIds[]
  bundlesToRemoveByPlanId?: Record<string, string[]>; // planId -> bundleIds[]

  // plan <-> channel
  channelsToAddByPlanId?: Record<string, string[]>; // planId -> channelIds[]
  channelsToRemoveByPlanId?: Record<string, string[]>; // planId -> channelIds[]

  // bundle-link <-> channel (bundleLinkKey = `${planId}:${bundleId}:${sortIndex}`)
  channelsToAddByBundleKey?: Record<string, string[]>; // bundleLinkKey -> channelIds[]
  channelsToRemoveByBundleKey?: Record<string, string[]>; // bundleLinkKey -> channelIds[]
};

type PlanPropertiesArgs = {
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
  id: string; // job/page id
  type: UpdateType;
  args: UpdateArgs;
  planIds: string[]; // scope
  status: 'draft' | 'ready' | 'submitted';
  createdAt: number;
  dirty?: boolean;
}

// ---- Drafts / Editor state ----------------------------------------------

export type DraftPatch<T> = Partial<T>;

export interface DraftsState {
  [x: string]: any;
  byJobId: Record<
    string, // jobId
    {
      plan: Record<string, DraftPatch<Plan>>; // planId -> fields
      bundle: Record<string, DraftPatch<Bundle>>; // linkKey -> fields (planId:bundleId:sortIndex)
      channel: Record<string, DraftPatch<Channel>>; // channelId -> fields
    }
  >;
}

export interface EditorState {
  jobs: UpdateJob[]; // ordered “pages”
  currentJobIndex: number; // active page
  drafts: DraftsState;
}

export type EntityPatchMap<T> = Record<string, DraftPatch<T>>; // id -> patch

export type DraftSpace = {
  plan: EntityPatchMap<Plan>;
  bundle: EntityPatchMap<Bundle>; // keyed by linkKey
  channel: EntityPatchMap<Channel>; // keyed by channelId
};

export type DraftsByJob = Record<string, DraftSpace>; // jobId -> DraftSpace

// ---- RenderArgs used by renderEditorsForJob -----------------------------

export type RenderArgs = {
  job: UpdateJob;
  plan: Plan;
  mergedPlan: Plan & Record<string, unknown>;
  dirty: boolean;

  // field patching
  onChangePlan: (planId: string, patch: Partial<Plan>) => void;

  // NOTE: for bundles, we patch by linkKey (planId:bundleId:sortIndex)
  onChangeBundle: (linkKey: string, patch: Partial<Bundle>) => void;
  onChangeChannel: (channelId: string, patch: Partial<Channel>) => void;

  // discard actions
  onDiscardPlan: (planId: string) => void;
  onDiscardBundle: (linkKey: string) => void;
  onDiscardChannel: (channelId: string) => void;

  // relationship actions
  // plan <-> bundle
  onAddBundleToPlan: (planId: string, bundleId: string) => void;
  onRemoveBundleFromPlan: (planId: string, bundleId: string) => void;

  // plan <-> channel
  onAddChannelToPlan: (planId: string, channelId: string) => void;
  onRemoveChannelFromPlan: (planId: string, channelId: string) => void;

  // bundle-link <-> channel
  onAddChannelToBundle: (bundleLinkKey: string, channelId: string) => void;
  onRemoveChannelFromBundle: (bundleLinkKey: string, channelId: string) => void;

  onOpenBundlePicker?: (planId: string) => void;
  onOpenChannelPicker?: (planId: string) => void;

  fieldsToShow?: string[];

  // merged entities per plan
  bundlesByPlanId?: Record<string, Bundle[]>; // these _should_ already include patches
  dirtyBundlesByPlanId?: Record<string, Record<string, boolean>>; // planId -> linkKey -> dirty
  channelsByPlanId?: Record<string, Channel[]>;
  dirtyChannelsByPlanId?: Record<string, Record<string, boolean>>; // planId -> channelId -> dirty

  // per-entity field dirty flags
  planFieldDirty?: Record<string, Set<string>>; // planId -> fields
  bundleFieldDirty?: Record<string, Set<string>>; // linkKey -> fields
  channelFieldDirty?: Record<string, Set<string>>; // channelId -> fields

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

// ---- PlanBundleList -----------------------------------------------------

/**
 * Convenience view of bundles grouped by plan.
 * Useful when you want a linear structure instead of bundlesByPlanId map.
 */
export type PlanBundleList = Array<{
  plan: Plan;
  bundles: Bundle[];
  // optional metadata you may want to tack on:
  dirtyBundles?: Record<string, boolean>; // linkKey -> dirty
  removedBundleIds?: string[]; // bundleIds marked for removal in this plan
}>;
