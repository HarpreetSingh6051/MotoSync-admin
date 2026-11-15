/** Cache records until the administrator explicitly refreshes them. */
export const manualQueryPolicy = {
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;
export const identityChanged = (previous: string | null, next: string | null) =>
  previous !== next;
