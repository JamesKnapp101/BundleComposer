import { TvMinimalPlay } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { User } from 'src/schema';
import { UpdateEditor, type UpdateJob } from '../../features/updateEditor/public';
import { useSelectedPlansQuery } from '../../lib/hooks/useSelectedPlansQuery';
import { cn } from '../../lib/utils/cn';
import { createDataService } from '../../ui/api/dataService';
import styles from '../../ui/BundleComposer.module.scss';
import { PageHeader } from '../../ui/components/PageHeader';
import { Icon } from '../../ui/icons/Icon';
import BCCancelJobButton from './components/BCCancelJobButton';
import BCSubmitButton from './components/BCSubmitButton';
import { serialize } from './utils/serialize';
import { setQueryParam } from './utils/setQueryParam';

const BundleComposer: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sp] = useSearchParams();
  const selectedIds = (sp.get('plans') ?? '').split(',').filter(Boolean);
  const api = createDataService({ baseUrl: 'http://localhost:5175', timeoutMs: 8000 });
  const selectedPlansDataQuery = useSelectedPlansQuery(selectedIds);
  const planIds = selectedPlansDataQuery?.plans?.map((plan) => plan.id).filter(Boolean) ?? [];

  useEffect(() => {
    if (!user) {
      api.getUser('testUser').then((response) => {
        setUser(response);
      });
    }
  }, [api, user]);

  const { plans: selectedPlans } = useSelectedPlansQuery(planIds);

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
                <BCSubmitButton />
              </>
            }
          />
        </div>
      </div>
      <UpdateEditor
        selectedPlans={selectedPlans}
        initialJobs={[]}
        onChangeActiveJob={(i: string | number) => setQueryParam('active', i)}
        onJobsChange={(jobs: UpdateJob[]) => setQueryParam('jobs', serialize(jobs))}
      />
    </main>
  );
};
export default BundleComposer;
