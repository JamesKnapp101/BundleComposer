import { toast } from 'sonner';

export const notify = {
  loading: (id: string, title: string, desc?: string) =>
    toast.loading(title, { id, description: desc, duration: Infinity }),
  success: (id: string, title: string, desc?: string, ms = 5000) =>
    toast.success(title, { id, description: desc, duration: ms }),
  error: (id: string, title: string, desc?: string, retry?: () => void, ms = 16000) =>
    toast.error(title, {
      id,
      description: desc,
      duration: ms,
      action: retry ? { label: 'Retry', onClick: retry } : undefined,
    }),
  dismiss: (id: string) => toast.dismiss(id),
};
