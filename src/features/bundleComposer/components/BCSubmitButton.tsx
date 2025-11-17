import { Button } from '../../../ui/inputs/Button';
import { useDispatchConfirmJobDetails } from './confirmations/dispatchConfirmJobDetails';

const BCSubmitButton: React.FC = () => {
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
