import { isEmpty } from 'lodash';

import { useCallback, type RefObject } from 'react';
import { useDispatch } from 'react-redux';
import styles from '../../../ui/BundleComposer.module.scss';
import BundleComposerLayout from '../../../ui/layouts/BundleComposerLayout';
import { BUNDLE_COMPOSER_ACTIONS_PORTAL } from '../constants';

interface BCPageContainerProps {
  formRef: RefObject<any>;
  domFormRef: RefObject<any>;
}

const BCPageContainer: React.FC<BCPageContainerProps> = ({ formRef, domFormRef }) => {
  const dispatch = useDispatch();

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
      <div>{'This will be the editor'}</div>
      {/* <PlanUpdatePageEditor
        formRef={formRef}
        domFormRef={domFormRef}
        onSubmitWithValidation={submitWithValidation}
      /> */}
    </BundleComposerLayout>
  );
};

export default BCPageContainer;
