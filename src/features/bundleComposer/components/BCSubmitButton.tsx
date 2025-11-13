import type { RefObject } from 'react';
import { Button } from '../../../ui/inputs/Button';

interface BCSubmitButtonProps {
  formRef: RefObject<any>;
}

const BCSubmitButton: React.FC<BCSubmitButtonProps> = ({ formRef }) => {
  return (
    <Button
      id="bundle-composer-submit-changes-button"
      data-testid="bundle-composer-submit-changes-button"
      title="Submit Updates"
      type="button"
      onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
        await formRef.current?.submit();
      }}
    >
      {'Submit Updates'}
    </Button>
  );
};
export default BCSubmitButton;
