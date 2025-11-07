import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../../../ui/inputs/Button';

interface BCCancelJobButtonProps {}

const BCCancelJobButton: React.FC<BCCancelJobButtonProps> = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Button
        id="bundle-composer-cancel-update-button"
        data-testid="bundle-composer-cancel-update-button"
        name="Back to Listing"
        onClick={() => {
          navigate(`/listing`);
        }}
        variant={'outline'}
      >
        <ArrowLeft className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
        {'Back to Listing'}
      </Button>
    </div>
  );
};
export default BCCancelJobButton;
