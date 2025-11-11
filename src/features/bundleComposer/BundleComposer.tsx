import { TvMinimalPlay } from 'lucide-react';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Dict } from 'src/schema';
import { UpdateEditor } from '../../features/updateEditor/public';
import { useSelectedPlansQuery } from '../../lib/hooks/useSelectedPlansQuery';
import { cn } from '../../lib/utils/cn';
import { createDataService } from '../../ui/api/dataService';
import styles from '../../ui/BundleComposer.module.scss';
import { PageHeader } from '../../ui/components/PageHeader';
import { Icon } from '../../ui/icons/Icon';
import type { DraftsByJob, UpdateJob } from '../updateEditor/types';
import BCCancelJobButton from './components/BCCancelJobButton';
import BCSubmitButton from './components/BCSubmitButton';
import { useDispatchConfirmCancelJob } from './components/confirmations/dispatchConfirmCancelJob';
import { useConfirmOnExit } from './hooks/useConfirmOnExit';
import {
  useLockAndCreateMasterJob,
  useUnlockPlansAndCancelMasterJob,
} from './hooks/useManageLockAndMasterJob';

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
  const navigate = useNavigate();
  const formRef = useRef<any>({});
  const domFormRef = useRef<HTMLFormElement>(null);
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
  console.log('selectedPlansDataQuery: ', selectedPlansDataQuery);

  useEffect(() => {
    api.getUser('mr.bulldops').then((response: any) => {
      setUser(response.user);
    });
  }, []);

  // This piece handles when the user attempts to leave the
  // Plan Update Wizard before they submit their changes, blocking
  // them with a confirmation modal before letting them proceed
  const planIds = selectedPlansDataQuery?.plans?.map((plan) => plan.id).filter(Boolean) ?? [];

  const dispatchConfirmCancelJob = useDispatchConfirmCancelJob();

  useConfirmOnExit(
    navigate,
    (_nextLocation, proceed, reset) => {
      dispatchConfirmCancelJob({
        planIds, // ← pass the actual ids
        unlockPlansAndCancelMasterJob, // ← your mutation
        proceed, // ← from useConfirmOnExit
        reset, // ← optional, for Cancel path
        onError: (e) => console.error('Unlock/Cancel failed:', e),
      });
    },
    '/listing',
    bypassConfirmationRef,
  );

  const { plans: selectedPlans } = useSelectedPlansQuery(planIds);

  function parseJobsFromUrlParam(s: string | null): UpdateJob[] {
    if (!s) return [];
    try {
      const arr = JSON.parse(decodeURIComponent(s));
      // TODO: validate shape with zod if you like
      return Array.isArray(arr) ? (arr as UpdateJob[]) : [];
    } catch {
      return [];
    }
  }

  // simple serializer
  function serialize(jobs: UpdateJob[]) {
    return encodeURIComponent(JSON.stringify(jobs));
  }

  // setQueryParam helper
  function setQueryParam(key: string, value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, '', url.toString());
  }

  // payload builder skeleton
  function buildAllPayloads(jobs: UpdateJob[], draftsByJob: DraftsByJob) {
    return jobs.map((job) => {
      const space = draftsByJob[job.id] ?? { plan: {}, bundle: {}, channel: {} };
      switch (job.type) {
        case 'plan-properties':
          return {
            type: job.type,
            planChanges: Object.entries(space.plan)
              .filter(([planId]) => job.planIds.includes(planId))
              .map(([planId, patch]) => ({ planId, patch })),
          };
        case 'plan-channels':
          return {
            type: job.type,
            channelChanges: Object.entries(space.channel).map(([channelId, patch]) => ({
              channelId,
              patch,
            })),
          };
        case 'plan-bundles':
        case 'plan-bundle-properties':
          return {
            type: job.type,
            bundleChanges: Object.entries(space.bundle).map(([bundleId, patch]) => ({
              bundleId,
              patch,
            })),
          };
        default:
          return { type: job.type };
      }
    });
  }

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

        <UpdateEditor
          selectedPlans={selectedPlans}
          initialJobs={[]} //jobsFromUrl}
          onChangeActiveJob={(i: any) => setQueryParam('active', i)}
          onJobsChange={(jobs: any) => setQueryParam('jobs', serialize(jobs))}
          onBuildPayloads={(jobs: any, draftsByJob: any) => buildAllPayloads(jobs, draftsByJob)}
        />
        {/* <BCPageContainer
          selectedPlansDataQuery={selectedPlansDataQuery}
          formRef={formRef}
          domFormRef={domFormRef}
        /> */}
      </main>
    );
};
export default BundleComposer;
