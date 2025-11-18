import { Button } from '@ui/inputs/Button';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';

interface NewUpdateButtonProps {
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
}

export const NewUpdateButton: React.FC<NewUpdateButtonProps> = ({
  onClick,
  className,
  'data-testid': testId = 'new-update-button',
}) => {
  return (
    <Button
      type="button"
      variant="primary"
      className={className}
      onClick={onClick}
      aria-label="Start new update"
      data-testid={testId}
    >
      <PlusCircle className="mr-2 h-4 w-4" />
      New Update
    </Button>
  );
};
