export const deepMerge = <T>(base: T, patch: Partial<T>): T => {
  if (patch == null) return base;
  if (Array.isArray(base) || Array.isArray(patch)) {
    return (patch as T) ?? base;
  }

  if (typeof base === 'object' && base && typeof patch === 'object') {
    const baseObj = base as Record<string, unknown>;
    const patchObj = patch as Record<string, unknown>;
    const out: Record<string, unknown> = { ...baseObj };

    for (const k of Object.keys(patchObj)) {
      const pv = patchObj[k];
      const shouldRecurse = pv !== null && typeof pv === 'object' && !Array.isArray(pv);
      if (shouldRecurse) {
        const bv = baseObj[k];
        out[k] = deepMerge<unknown>(bv, pv as Partial<unknown>);
      } else {
        out[k] = pv;
      }
    }
    return out as T;
  }
  return (patch as T) ?? base;
};
