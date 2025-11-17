export const setQueryParam = (key: string, value: string | number) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key.toString(), value.toString());
  window.history.replaceState(null, '', url.toString());
};
