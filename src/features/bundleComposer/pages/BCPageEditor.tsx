// import { useCallback, useMemo, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom';
// import type { EditorPhase, Plan, UpdateArgs, UpdateJob, UpdateType } from 'src/schema';
// import { useSelectedPlansQuery } from '../../../lib/hooks';
// import { PageNavigator } from '../../updateEditor/components/PageNavigator';
// import { clearAll, clearDraft, upsertDraft } from '../store/draftSlice';
// import type { RootState } from '../store/store';
// import { SelectionRow } from '@features/updateEditor/components/SelectionRow';

// export function PlanUpdateEditor({ selectedPlans }: { selectedPlans: Plan[] }) {
//   const [phase, setPhase] = useState<EditorPhase>('select');
//   const [job, setJob] = useState<UpdateJob | null>(null);

//   const [sp] = useSearchParams();
//   const ids = useMemo(() => (sp.get('plans') ?? '').split(',').filter(Boolean), [sp]);

//   const { plans } = useSelectedPlansQuery(ids);
//   const dispatch = useDispatch();
//   const patches = useSelector((s: RootState) => s.drafts.plan);

//   const dirtyIds = useMemo(
//     () => plans.map((p) => p.id).filter((id) => Boolean(patches[id])),
//     [plans, patches],
//   );

//   const onChangePlan = useCallback(
//     (id: string, patch: Partial<Plan>) =>
//       dispatch(
//         upsertDraft({
//           id,
//           patch,
//           type: 'plan',
//         }),
//       ),
//     [dispatch],
//   );

//   const onDiscard = useCallback(
//     (id: string) =>
//       dispatch(
//         clearDraft({
//           id,
//           type: 'plan',
//         }),
//       ),
//     [dispatch],
//   );

//   const discardAll = useCallback(() => {
//     if (!dirtyIds.length) return;
//     dispatch(clearAll());
//   }, [dispatch, dirtyIds]);

//   const saveAll = useCallback(async () => {
//     // TODO: call your API to persist changes; for demo just clear
//     // await api.savePlans(dirtyIds.map(id => ({ id, ...patches[id] })));
//     // dispatch(clearMany(dirtyIds));
//   }, [dispatch, dirtyIds /*, patches*/]);

//   const onTypePicked = (t: UpdateType) => {
//     setJob({
//       id: crypto.randomUUID(),
//       type: t,
//       args: { type: t } as UpdateArgs,
//       planIds: selectedPlans.map((p) => p.id),
//       status: 'draft',
//       createdAt: Date.now(),
//       dirty: false,
//     });
//     setPhase('configure');
//   };

//   const onArgsChange = (partial: Partial<UpdateArgs>) => {
//     setJob((j) => (j ? { ...j, args: { ...j.args, ...partial } as UpdateArgs, dirty: true } : j));
//   };

//   const onConfirmConfig = () => {
//     // validate args for job.type; if valid:
//     setPhase('edit');
//   };

//   const onChangeJob = () => {
//     // if dirty, confirm
//     setPhase('select');
//     setJob(null);
//   };

//   const onSubmit = async () => {
//     // run validation again; submit; handle errors
//     setJob((j) => (j ? { ...j, status: 'submitted', dirty: false } : j));
//     // optionally setPhase('submitted');
//   };

//   return (
//     <div className="flex flex-col gap-3">
//       {/* Header already exists with Back to Listing + Submit */}
//       {phase !== 'edit' && (
//         <SelectionRow
//           job={job}
//           phase={phase}
//           onTypePicked={onTypePicked}
//           onArgsChange={onArgsChange}
//           onConfirmConfig={onConfirmConfig}
//         />
//       )}

//       {phase === 'edit' && job && <JobBar job={job} onChange={onChangeJob} />}

//       {phase === 'edit' && job && (
//         <div className="flex flex-col gap-2">
//           <div className="flex items-center justify-between">
//             <PageNavigator
//               current={0}
//               total={0}
//               onChange={function (nextIndex: number): void {
//                 throw new Error('Function not implemented.');
//               }}
//               onSubmitWithValidation={function (): Promise<boolean> {
//                 throw new Error('Function not implemented.');
//               }}
//             />
//             <PagePicker />
//           </div>
//           {/* <PlanVirtualList
//             plans={plans}
//             patches={patches}
//             onChangePlan={onChangePlan}
//             onDiscard={onDiscard}
//           /> */}
//           <div className="flex items-center justify-end gap-2">
//             <DiscardUpdate
//               disabled={!job.dirty}
//               onClick={() => {
//                 /* reset/clear patches */
//               }}
//             />
//             <NewUpdate
//               onClick={() => {
//                 setPhase('select');
//                 setJob(null);
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
