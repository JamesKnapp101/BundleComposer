import { LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../../ui/icons/Icon';
import { Button } from '../../../../ui/inputs/Button';
import { useLockAndCreateMasterJob } from '../../hooks/useManageLockAndMasterJob';
import styles from './LandingListPage.module.scss';

interface LandingListPageHeaderProps {
  rowSelection: Record<string, boolean>;
}

const LandingListPageHeader = ({ rowSelection: RowSelectionState }: LandingListPageHeaderProps) => {
  const { mutate, isPending, error } = useLockAndCreateMasterJob();
  const selectedIds = Object.keys(RowSelectionState);
  const navigate = useNavigate();
  const launchBundleComposer = () => {
    mutate({
      planIds: selectedIds,
      lockOwner: 'bundle-composer',
      metadata: { reason: 'publish-run' },
    });

    const q = new URLSearchParams();
    q.set('plans', selectedIds.join(','));
    navigate(`/bundle-composer?${q.toString()}`);
  };

  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleContainer}>
        <Icon of={LayoutList} size={32} />
        <span className="ml-2 text-lg font-medium" style={{ color: 'black' }}>
          {`Plans`}
        </span>
      </div>
      <Button className="ml-4" variant="primary" size="md" onClick={launchBundleComposer}>
        {error ? ' (failed)' : null}
        Bundle Composer
      </Button>
    </div>
  );
};
export default LandingListPageHeader;
