import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const qc = new QueryClient();

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};
