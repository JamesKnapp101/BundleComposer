import { isEmpty } from 'lodash';

import { useCallback, type RefObject } from 'react';
import styles from '../../../ui/BundleComposer.module.scss';
import BundleComposerLayout from '../../../ui/layouts/BundleComposerLayout';
import BundleComposerPage from '../components/BundleComposerPage';
import { BUNDLE_COMPOSER_ACTIONS_PORTAL } from '../constants';

interface BCPageContainerProps {
  formRef: RefObject<any>;
  domFormRef: RefObject<any>;
  selectedPlansDataQuery: {
    plans: any[];
    byId: Record<
      string,
      {
        id: string;
        name: string;
        status: 'active' | 'inactive' | 'pending';
        versionId: string;
        planTier:
          | 'Nickel'
          | 'Copper'
          | 'Bronze'
          | 'Silver'
          | 'Gold'
          | 'Platinum'
          | 'Palladium'
          | 'Rhodium';
        pricingModel: 'flat' | 'per-bundle' | 'per-channel' | 'hybrid';
        basePrice: number;
      }
    >;
    allIds: string[];
    isDirty: (id: string) => boolean;
  };
}

const BCPageContainer: React.FC<BCPageContainerProps> = ({
  formRef,
  domFormRef,
  selectedPlansDataQuery,
}) => {
  const submitWithValidation = useCallback(async (): Promise<boolean> => {
    const el = domFormRef.current;
    // Check validity
    if (el?.reportValidity && !el.reportValidity()) {
      return false;
    }
    // Submit
    await formRef.current?.submit();
    // Check form state after submit attempt in case of errors
    const formState = formRef.current?.getState();
    const formErrors = !!formState?.invalid || Object.keys(formState?.errors ?? {}).length > 0;
    if (formErrors && !isEmpty(formState.errors)) {
      //  dispatchConfirmValidationErrors(dispatch, formState.errors);
      return false;
    }
    return true;
  }, []);

  return (
    <BundleComposerLayout
      header={<div className={styles.header}>{'Updates'}</div>}
      navigation={
        <div className={styles.navigation}>
          {/* <PlanUpdatePageNavigator onSubmitWithValidation={submitWithValidation} />
          <PlanUpdatePagePicker onSubmitWithValidation={submitWithValidation} /> */}
        </div>
      }
      footer={<span id={BUNDLE_COMPOSER_ACTIONS_PORTAL}></span>}
    >
      <BundleComposerPage />
    </BundleComposerLayout>
  );
};

export default BCPageContainer;
