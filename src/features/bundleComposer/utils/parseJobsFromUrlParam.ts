import type { UpdateJob } from '@features/updateEditor/types';

export const parseJobsFromUrlParam = (s: string | null): UpdateJob[] => {
  if (!s) return [];
  try {
    const arr = JSON.parse(decodeURIComponent(s));
    // TODO: validate shape with zod if you like
    return Array.isArray(arr) ? (arr as UpdateJob[]) : [];
  } catch {
    return [];
  }
};
