import type { ColumnDef } from '@tanstack/react-table';

type Row = { name: string };

export const useLandingListPageColumns = (): ColumnDef<Row, any>[] => [
  {
    accessorKey: 'name',
    header: 'Plan Name',
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
    accessorKey: 'hdPackage',
    header: 'HD Package',
    cell: (info) => {
      return <div className="text-start">{info.getValue() === true ? 'Yes' : 'No'}</div>;
    },
  },
  {
    accessorKey: 'state',
    header: 'State',
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    cell: (info) => {
      return <div className="text-start">{info.getValue()}</div>;
    },
  },
  {
    accessorKey: 'renewDate',
    header: 'Renews On',
    cell: (info) => {
      return <div className="text-start">{info.getValue()?.split('T')?.[0]}</div>;
    },
  },
];
