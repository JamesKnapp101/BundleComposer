import { TvMinimalPlay } from 'lucide-react';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UpdateEditor } from '../../features/updateEditor/public';
import { useSelectedPlansQuery } from '../../lib/hooks/useSelectedPlansQuery';
import { cn } from '../../lib/utils/cn';
import { createDataService } from '../../ui/api/dataService';
import styles from '../../ui/BundleComposer.module.scss';
import { PageHeader } from '../../ui/components/PageHeader';
import { Icon } from '../../ui/icons/Icon';
import BCCancelJobButton from './components/BCCancelJobButton';
import BCSubmitButton from './components/BCSubmitButton';
import { useDispatchConfirmCancelJob } from './components/confirmations/dispatchConfirmCancelJob';
import { useConfirmOnExit } from './hooks/useConfirmOnExit';
import {
  useLockAndCreateMasterJob,
  useUnlockPlansAndCancelMasterJob,
} from './hooks/useManageLockAndMasterJob';
import { buildAllPayloads } from './utils/buildAllPayloads';
import { serialize } from './utils/serialize';
import { setQueryParam } from './utils/setQueryParam';

const BundleComposer: React.FC<PropsWithChildren<any>> = () => {
  const navigate = useNavigate();
  const formRef = useRef<any>({});
  const bypassConfirmationRef = useRef(false);
  const [unlockingPlans, setUnlockingPlans] = useState<boolean>();
  const [user, setUser] = useState<any>(null);

  const [sp] = useSearchParams();
  const selectedIds = (sp.get('plans') ?? '').split(',').filter(Boolean);

  const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });

  const unlockPlansAndCancelMasterJob = useUnlockPlansAndCancelMasterJob({
    onSuccess: () => {
      bypassConfirmationRef.current = true;
      setUnlockingPlans(false);
    },
  });
  // useUpdateContainerHeightVars();

  const lockAndMasterJobCreationResult = useLockAndCreateMasterJob();

  const statusMsg = {
    LOCKING: 'Locking Selected Plans, Please Stand By...',
    UNLOCKING: 'Unlocking Selected Plans, Please Stand By...',
    LOADING: 'Loading Selected Plan Data, Please Stand By...',
  };

  const selectedPlansDataQuery = useSelectedPlansQuery(selectedIds);
  const planIds = selectedPlansDataQuery?.plans?.map((plan) => plan.id).filter(Boolean) ?? [];
  console.log('selectedPlansDataQuery: ', selectedPlansDataQuery);

  useEffect(() => {
    api.getUser('mr.bulldops').then((response: any) => {
      setUser(response.user);
    });
  }, []);

  const dispatchConfirmCancelJob = useDispatchConfirmCancelJob();
  useConfirmOnExit(
    navigate,
    (_nextLocation, proceed, reset) => {
      dispatchConfirmCancelJob({
        planIds,
        unlockPlansAndCancelMasterJob,
        proceed,
        reset,
        onError: (e) => console.error('Unlock/Cancel failed:', e),
      });
    },
    '/listing',
    bypassConfirmationRef,
  );

  const { plans: selectedPlans } = useSelectedPlansQuery(planIds);

  //if (!selectedPlansDataQuery) return <MessagedSpinner message={statusMsg.LOADING} />;
  if (lockAndMasterJobCreationResult.status !== 'success')
    //   return <MessagedSpinner message={statusMsg.LOCKING} />;
    // if (unlockingPlans === true) return <MessagedSpinner message={statusMsg.UNLOCKING} />;

    return (
      <main className={styles.container}>
        <div className={styles.headerContainer}>
          <div className={styles.titleContainer}>
            <PageHeader
              className="flex items-center"
              variant="record"
              title="Bundle Composer"
              icon={
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
                  <Icon
                    className={cn(styles.icon, 'h-5 w-5 text-slate-700')}
                    name="tv-minimal-play"
                    of={TvMinimalPlay}
                    size={32}
                  />
                </span>
              }
              actions={
                <>
                  <BCCancelJobButton />
                  <BCSubmitButton formRef={formRef} />
                </>
              }
            />
          </div>
        </div>
        <UpdateEditor
          selectedPlans={selectedPlans}
          initialJobs={[]} //jobsFromUrl}
          onChangeActiveJob={(i: any) => setQueryParam('active', i)}
          onJobsChange={(jobs: any) => setQueryParam('jobs', serialize(jobs))}
          onBuildPayloads={(jobs: any, draftsByJob: any) => buildAllPayloads(jobs, draftsByJob)}
        />
      </main>
    );
};
export default BundleComposer;
