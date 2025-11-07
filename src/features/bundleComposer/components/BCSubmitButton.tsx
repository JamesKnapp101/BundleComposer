import type { RefObject } from 'react';
import { Button } from '../../../ui/inputs/Button';

interface BCSubmitButtonProps {
  formRef: RefObject<any>;
  domFormRef: RefObject<any>;
  bypassConfirmationRef: RefObject<boolean>;
}

const BCSubmitButton: React.FC<BCSubmitButtonProps> = ({
  formRef,
  domFormRef,
  bypassConfirmationRef,
}) => {
  return (
    <Button
      id="plan-update-wizard-submit-changes-button"
      data-testid="plan-update-wizard-submit-changes-button"
      title="Submit Updates"
      type="button"
      onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
        await formRef.current?.submit();
      }}
    >
      {' '}
      Submit Updates
    </Button>
  );
};
export default BCSubmitButton;
