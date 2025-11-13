import { UpdateType } from '../types';

export const labelForType = (updateType: UpdateType): string => {
  switch (updateType) {
    case UpdateType.PlanProperties:
      return 'Plan Properties';
    case UpdateType.PlanChannels:
      return 'Plan Channels';
    case UpdateType.PlanBundles:
      return 'Plan Bundles';
    case UpdateType.PlanBundleProperties:
      return 'Plan Bundle Properties';
    default:
      return 'Update';
  }
};
