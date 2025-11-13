import type { DraftsByJob, UpdateJob } from '@features/updateEditor/types';

export const buildAllPayloads = (jobs: UpdateJob[], draftsByJob: DraftsByJob) => {
  return jobs.map((job) => {
    const space = draftsByJob[job.id] ?? { plan: {}, bundle: {}, channel: {} };
    switch (job.type) {
      case 'plan-properties':
        return {
          type: job.type,
          planChanges: Object.entries(space.plan)
            .filter(([planId]) => job.planIds.includes(planId))
            .map(([planId, patch]) => ({ planId, patch })),
        };
      case 'plan-channels':
        return {
          type: job.type,
          channelChanges: Object.entries(space.channel).map(([channelId, patch]) => ({
            channelId,
            patch,
          })),
        };
      case 'plan-bundles':
      case 'plan-bundle-properties':
        return {
          type: job.type,
          bundleChanges: Object.entries(space.bundle).map(([bundleId, patch]) => ({
            bundleId,
            patch,
          })),
        };
      default:
        return { type: job.type };
    }
  });
};
