import { RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Button } from '../../../ui/inputs/Button';

type DiscardUpdateButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  /** If true, shows a native confirm before discarding. Default: true */
  confirm?: boolean;
  className?: string;
  'data-testid'?: string;
};

export const DiscardUpdateButton: React.FC<DiscardUpdateButtonProps> = ({
  disabled,
  onClick,
  confirm = true,
  className,
  'data-testid': testId = 'discard-update-button',
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (!confirm || window.confirm('Discard all unsaved changes for this update?')) {
      onClick();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-label="Discard update"
      data-testid={testId}
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      Discard Update
    </Button>
  );
};
