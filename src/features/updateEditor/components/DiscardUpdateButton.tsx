import { RotateCcw } from 'lucide-react';
import * as React from 'react';
import { useDispatchConfirmDiscardAllChanges } from '../../../features/bundleComposer/components/confirmations/dispatchConfirmDiscardAllChanges';
import { Button } from '../../../ui/inputs/Button';

interface DiscardUpdateButtonProps {
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
}

export const DiscardUpdateButton: React.FC<DiscardUpdateButtonProps> = ({
  disabled,
  onClick,
  className,
  'data-testid': testId = 'discard-update-button',
}) => {
  const dispatchConfirmDiscardAllChanges = useDispatchConfirmDiscardAllChanges(onClick);
  const handleClick = () => {
    if (disabled) return;
    dispatchConfirmDiscardAllChanges();
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
      {'Discard Update'}
    </Button>
  );
};
