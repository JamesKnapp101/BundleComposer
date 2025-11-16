import type { RefObject } from 'react';
import { Button } from '../../../ui/inputs/Button';
import { useDispatchConfirmJobDetails } from './confirmations/dispatchConfirmJobDetails';

interface BCSubmitButtonProps {
  formRef: RefObject<any>;
}

const BCSubmitButton: React.FC<BCSubmitButtonProps> = () => {
  const dispatchConfirmDiscardAllChanges = useDispatchConfirmJobDetails();
  return (
    <Button
      id="bundle-composer-submit-changes-button"
      data-testid="bundle-composer-submit-changes-button"
      title="Submit Updates"
      type="button"
      onClick={dispatchConfirmDiscardAllChanges}
    >
      {'Submit Updates'}
    </Button>
  );
};
export default BCSubmitButton;
