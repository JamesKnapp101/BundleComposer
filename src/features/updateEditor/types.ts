import type { Bundle, Channel, Plan } from 'src/schema';

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

export type UpdateArgs =
  | { type: typeof UpdateType.PlanProperties; planPropertyKeys?: string[] }
  | {
      type: typeof UpdateType.PlanChannels;
      channelIds?: string[];
      scope?: 'all' | 'local' | 'non-local';
    }
  | { type: typeof UpdateType.PlanBundles; bundleIds?: string[]; mode?: 'add' | 'remove' | 'edit' }
  | { type: typeof UpdateType.PlanBundleProperties; bundleIds?: string[]; propertyKeys?: string[] };

export interface UpdateJob {
  id: string; // job/page id
  type: UpdateType;
  args: UpdateArgs;
  planIds: string[]; // scope
  status: 'draft' | 'ready' | 'submitted';
  createdAt: number;
  dirty?: boolean;
}
export type DraftPatch<T> = Partial<T>;

export interface DraftsState {
  [x: string]: any;
  byJobId: Record<
    string, // jobId
    {
      plan: Record<string, DraftPatch<Plan>>; // planId -> fields
      bundle: Record<string, DraftPatch<Bundle>>; // bundleId -> fields
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
  bundle: EntityPatchMap<Bundle>;
  channel: EntityPatchMap<Channel>;
};

export type DraftsByJob = Record<string, DraftSpace>; // jobId -> DraftSpace
