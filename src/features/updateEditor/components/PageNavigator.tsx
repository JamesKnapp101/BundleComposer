import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../../ui/inputs/Button';

interface PageNavigatorProps {
  current: number;
  total: number;
  onChange: (nextIndex: number) => void;
  onSubmitWithValidation: () => Promise<boolean>;
  maxVisibleButtons?: number;
  className?: string;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  current,
  total,
  onChange,
  onSubmitWithValidation,
  maxVisibleButtons = 7,
  className,
}) => {
  const disabledPrev = current <= 0;
  const disabledNext = current >= total - 1;

  // compute visible window
  let start = Math.max(0, current - 1);
  if (current > total - maxVisibleButtons) {
    start = Math.max(0, total - maxVisibleButtons);
  }
  const count = Math.min(maxVisibleButtons, total);
  const visible = Array.from({ length: count }, (_, i) => start + i);

  const goTo = async (idx: number) => {
    const ok = await onSubmitWithValidation();
    if (!ok) return;
    onChange(idx);
  };

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      data-testid="bundle-composer-navigator-tray"
    >
      {/* First */}
      <Button
        id="plan-line-item-button-first"
        data-testid="plan-line-item-button-first"
        variant="outline"
        size="md"
        disabled={disabledPrev}
        aria-label="First"
        onClick={() => goTo(0)}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous */}
      <Button
        id="plan-line-item-button-previous"
        data-testid="plan-line-item-button-previous"
        variant="outline"
        size="md"
        disabled={disabledPrev}
        aria-label="Previous"
        onClick={() => goTo(current - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Numbered page buttons */}
      {visible.map((index) => {
        const isActive = index === current;
        return (
          <Button
            key={`plan-line-item-button-current_${index}`}
            id="plan-line-item-button-current"
            data-testid="plan-line-item-button-current"
            variant={isActive ? 'primary' : 'outline'}
            className={cn('h-8 px-3', isActive && 'font-semibold')}
            onClick={() => goTo(index)}
          >
            {index + 1}
          </Button>
        );
      })}

      {/* Next */}
      <Button
        id="plan-line-item-button-next"
        data-testid="plan-line-item-button-next"
        variant="outline"
        size="md"
        disabled={disabledNext}
        aria-label="Next"
        onClick={() => goTo(current + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last */}
      <Button
        id="plan-line-item-button-last"
        data-testid="plan-slideshow-button-last"
        variant="outline"
        size="md"
        disabled={disabledNext}
        aria-label="Last"
        onClick={() => goTo(total - 1)}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
