export function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (patch == null) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return (patch as T) ?? base;
  if (typeof base === 'object' && typeof patch === 'object') {
    const out: any = { ...base };
    for (const k of Object.keys(patch)) {
      const pv = (patch as any)[k];
      out[k] =
        typeof pv === 'object' && pv && !Array.isArray(pv) ? deepMerge((base as any)[k], pv) : pv;
    }
    return out;
  }
  return (patch as T) ?? base;
}
