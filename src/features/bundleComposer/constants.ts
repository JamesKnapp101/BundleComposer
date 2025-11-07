export const planUpdateWizardFormID: string = 'plan-update-wizard-change-form';
export const updateTypes = {
  LOCAL_CHANNELS: 'Local Channels',
  PLAN_ATTRIBUTES: 'Plan Attributes',
  BUNDLE_CHANNELS: 'Bundle Channels',
  BUNDLE_ATTRIBUTES: 'Bundle Attributes',
  CHANNELS: 'Channels',
};
export const planUpdateWizardUpdateOptions: string[] = [
  updateTypes.PLAN_ATTRIBUTES,
  updateTypes.LOCAL_CHANNELS,
  updateTypes.BUNDLE_CHANNELS,
  updateTypes.BUNDLE_ATTRIBUTES,
  updateTypes.CHANNELS,
];
export const updateTypeObjMap = {
  [updateTypes.LOCAL_CHANNELS]: 'localchannel',
  [updateTypes.PLAN_ATTRIBUTES]: 'plan',
  [updateTypes.BUNDLE_CHANNELS]: 'bundlechannel',
  [updateTypes.BUNDLE_ATTRIBUTES]: 'bundle',
};
export const BUNDLE_COMPOSER_ACTIONS_PORTAL = 'BUNDLE_COMPOSER_ACTIONS_PORTAL';
