import { cn } from '@lib/utils/cn';
import * as Checkbox from '@radix-ui/react-checkbox';

export const UICheckbox = ({
  className,
  ...props
}: Checkbox.CheckboxProps & { className?: string }) => {
  return (
    <Checkbox.Root
      className={cn(
        'h-4 w-4 shrink-0 rounded border border-slate-300 bg-white',
        'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
        'focus:outline-none focus:ring-2 focus:ring-blue-600',
        className,
      )}
      {...props}
    >
      <Checkbox.Indicator className="text-white text-[12px] leading-4 pl-[2px]">
        ✓
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
};
