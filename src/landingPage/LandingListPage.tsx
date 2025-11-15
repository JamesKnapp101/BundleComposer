import { useState } from 'react';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import type { Plan, PlanRow } from 'src/schema';
import data from '../server/mocks/fixtures/plans.base.json';
import { ListingLayout } from '../ui/layouts/ListingLayout';
import { Table } from '../ui/table/Table';
import { TableContainer } from '../ui/table/TableContainer';
import { useLandingListPageColumns } from './hooks/useLandingListPageColumns';
import LandingListPageHeader from './LandingListPageHeader';

const LandingListPage = () => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]); // ✅ typed
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const columns = useLandingListPageColumns();

  const table = useReactTable<PlanRow>({
    data,
    columns,
    state: { rowSelection, sorting, columnFilters },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original);

  return (
    <div className="bg-slate-50">
      <ListingLayout header={<LandingListPageHeader selectedRows={selectedRows as Plan[]} />}>
        <div className="h-full">
          <TableContainer>
            <Table<PlanRow> table={table} selectable />
          </TableContainer>
        </div>
      </ListingLayout>
    </div>
  );
};
export default LandingListPage;
