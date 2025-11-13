import { UpdateType, type UpdateArgs } from '../types';

export const summarizeArgs = (args: UpdateArgs): string => {
  switch (args.type) {
    case UpdateType.PlanProperties: {
      const keys = args.planPropertyKeys?.length
        ? args.planPropertyKeys.join(', ')
        : 'All common properties';
      return `Fields: ${keys}`;
    }
    case UpdateType.PlanChannels: {
      const scope = args.scope ?? '—';
      const ids = args.channelIds?.length ? `${args.channelIds.length} channel(s)` : 'All channels';
      return `Scope: ${scope} · ${ids}`;
    }
    case UpdateType.PlanBundles: {
      const mode = args.mode ?? '—';
      const ids = args.bundleIds?.length
        ? `${args.bundleIds.length} bundle(s)`
        : mode === 'add'
          ? 'Add new'
          : 'All bundles';
      return `Mode: ${mode} · ${ids}`;
    }
    case UpdateType.PlanBundleProperties: {
      const ids = args.bundleIds?.length ? `${args.bundleIds.length} bundle(s)` : 'All bundles';
      const keys = args.propertyKeys?.length ? `${args.propertyKeys.length} key(s)` : 'All keys';
      return `${ids} · ${keys}`;
    }
    default:
      return '';
  }
};
