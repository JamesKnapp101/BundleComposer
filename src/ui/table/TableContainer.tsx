import styles from './Table.module.scss';

export function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <div className="rounded-md border-2 border-slate-300 bg-white">{children}</div>
    </div>
  );
}
