import { TvMinimalPlay } from 'lucide-react';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDataService } from '../../ui/api/dataService';
import styles from '../../ui/BundleComposer.module.scss';
import { PageHeader } from '../../ui/components/PageHeader';
import { useSelectedPlansQuery } from '../../ui/hooks/useSelectedPlansQuery';
import { Icon } from '../../ui/icons/Icon';
import BCCancelJobButton from './components/BCCancelJobButton';
import BCSubmitButton from './components/BCSubmitButton';
import { useDispatchConfirmCancelJob } from './components/confirmations/dispatchConfirmCancelJob';
import { useConfirmOnExit } from './hooks/useConfirmOnExit';
import { useUnlockPlansAndCancelMasterJob } from './hooks/useManageLockAndMasterJob';
import BCPageContainer from './pages/BCPageContainer';
import type { Dict } from './types';

export type PlanUpdateWizardChangeObjectAttributeObj = {
  [objectType: string]: {
    name?: string;
    objectId?: string;
    propName?: string;
  };
};

export type PlanUpdateWizardChangeObj = {
  index: number;
  updateType: string;
  name: string;
  displayName: string;
  attributeObj?: PlanUpdateWizardChangeObjectAttributeObj;
  values?: Dict;
};

const BundleComposer: React.FC<PropsWithChildren<any>> = (props) => {
  console.log('BundleComposer component rendered');
  const dispatch = useDispatch();
  const confirmCancel = useDispatchConfirmCancelJob();
  const location = useLocation();
  const navigate = useNavigate();
  const formRef = useRef<any>({});
  const domFormRef = useRef<HTMLFormElement>(null);
  const unblockRef = useRef<(() => void) | null>(null);
  const bypassConfirmationRef = useRef(false);
  const [unlockingPlans, setUnlockingPlans] = useState<boolean>();
  const [user, setUser] = useState<any>(null);

  const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });

  const unlockPlansAndCancelMasterJob = useUnlockPlansAndCancelMasterJob({
    onSuccess: () => {
      bypassConfirmationRef.current = true;
      navigate('/listing');
      setUnlockingPlans(false);
    },
  });
  // useUpdateContainerHeightVars();

  // const lockAndMasterJobCreationResult = useLockAndCreateMasterJob(
  //   selectedPlanObjectIdList,
  //   false,
  //   'plans',
  //   user,
  // );

  const statusMsg = {
    LOCKING: 'Locking Selected Plans, Please Stand By...',
    UNLOCKING: 'Unlocking Selected Plans, Please Stand By...',
    LOADING: 'Loading Selected Plan Data, Please Stand By...',
  };

  const selectedPlansDataQuery = useSelectedPlansQuery(['p1', 'p2']);

  useEffect(() => {
    api.getUser('mr.bulldops').then((response: any) => {
      setUser(response.user);
    });
  }, []);

  // This piece handles when the user attempts to leave the
  // Plan Update Wizard before they submit their changes, blocking
  // them with a confirmation modal before letting them proceed
  const planIds = selectedPlansDataQuery?.plans?.map((plan) => plan.id).filter(Boolean) ?? [];

  console.log('Plan IDs for confirmation on exit:', planIds, selectedPlansDataQuery?.plans);

  useConfirmOnExit(
    navigate,
    (_tx, cancelBlockAndNavigate) => {
      confirmCancel({
        planIds,
        unlockPlansAndCancelMasterJob,
        cancelBlockAndNavigate: () => {
          console.log('User confirmed cancel and navigate');
          cancelBlockAndNavigate();
        },
      });
    },
    '/listing',
    bypassConfirmationRef,
  );

  //if (!selectedPlansDataQuery) return <MessagedSpinner message={statusMsg.LOADING} />;
  // if (lockAndMasterJobCreationResult.status !== 'success')
  //   return <MessagedSpinner message={statusMsg.LOCKING} />;
  // if (unlockingPlans === true) return <MessagedSpinner message={statusMsg.UNLOCKING} />;

  return (
    <main className={styles.container} data-testid="plan-update-wizard">
      <div className={styles.headerContainer}>
        <div className={styles.titleContainer}>
          <PageHeader
            className="flex items-center"
            variant="record"
            title="Bundle Composer"
            icon={
              <Icon className={styles.icon} name="tv-minimal-play" of={TvMinimalPlay} size={32} />
            }
            actions={
              <>
                <BCCancelJobButton />
                <BCSubmitButton
                  formRef={formRef}
                  domFormRef={domFormRef}
                  bypassConfirmationRef={bypassConfirmationRef}
                />
              </>
            }
          />
        </div>
      </div>
      <BCPageContainer formRef={formRef} domFormRef={domFormRef} />
    </main>
  );
};
export default BundleComposer;
