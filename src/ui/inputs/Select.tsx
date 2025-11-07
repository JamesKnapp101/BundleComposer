import * as Select from '@radix-ui/react-select';
import { cn } from '../../lib/utils/cn';

export const BCSelect = ({
  value,
  onValueChange,
  placeholder = 'Select…',
  children,
  className,
}: React.ComponentProps<typeof Select.Root> & { className?: string; placeholder?: string }) => {
  return (
    <Select.Root value={value as string} onValueChange={onValueChange}>
      <Select.Trigger
        className={cn(
          'inline-flex h-9 w-[220px] items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-600',
          className,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>▾</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <Select.Viewport className="p-1">{children}</Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export const BCSelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
  return (
    <Select.Item
      value={value}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm',
        'outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:font-medium',
      )}
    >
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
};
