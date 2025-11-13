import type { UpdateJob } from '@features/updateEditor/types';

export const serialize = (jobs: UpdateJob[]) => {
  return encodeURIComponent(JSON.stringify(jobs));
};
