import type React from 'react';
import type { ReactNode } from 'react';
import styles from '../../ui/BundleComposer.module.scss';
import { Card } from '../components/Card';

interface BundleComposerLayoutProps {
  header: ReactNode;
  navigation: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

const BundleComposerLayout: React.FC<BundleComposerLayoutProps> = ({
  header,
  navigation,
  footer,
  children,
}) => {
  return (
    <Card className={styles.card} data-testid="bundle-composer-layout-container">
      <div className={styles.actionsTray}>
        {header}
        {navigation}
      </div>
      {children}
      <div className={styles.actionButtonTray}>{footer}</div>
    </Card>
  );
};

export default BundleComposerLayout;
