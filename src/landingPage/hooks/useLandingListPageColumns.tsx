import type { ColumnDef } from '@tanstack/react-table';
import type { PlanRow } from 'src/schema';

type Row = { name: string };

const cashify = (val: number) => {
  return `$${val}.99`;
};

export const useLandingListPageColumns = (): ColumnDef<PlanRow, any>[] => [
  {
    accessorKey: 'versionId',
    header: 'Version',
    size: 60,
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'name',
    header: 'Plan Name',
    size: 200,
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 200,
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 200,
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'planTier',
    header: 'Tier',
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'pricingModel',
    header: 'Price Model',
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'monthlyPrice',
    header: 'Monthly Price',
    cell: (info) => {
      return <div className="text-start">{cashify(info.getValue())}</div>;
    },
  },
];
