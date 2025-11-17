import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import type { Plan, PlanRow } from 'src/schema';
import { PageNavigator } from '../features/updateEditor/components/PageNavigator';
import data from '../server/mocks/fixtures/plans.base.json';
import { ListingLayout } from '../ui/layouts/ListingLayout';
import { Table } from '../ui/table/Table';
import { TableContainer } from '../ui/table/TableContainer';
import { useLandingListPageColumns } from './hooks/useLandingListPageColumns';
import LandingListPageHeader from './LandingListPageHeader';

const LandingListPage = () => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const columns = useLandingListPageColumns();

  const table = useReactTable<PlanRow>({
    data,
    columns,
    state: { rowSelection, sorting, columnFilters, pagination },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original);

  const totalRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const pageEnd = Math.min(totalRows, (pageIndex + 1) * pageSize);
  const pageCount = table.getPageCount();

  const handleChangePage = (idx: number) => {
    table.setPageIndex(idx);
  };

  const handleSubmitWithValidation = async () => true; // There is no spoon

  return (
    <div className="bg-slate-50">
      <ListingLayout
        bodyClassName="flex flex-col"
        header={<LandingListPageHeader selectedRows={selectedRows as unknown as Plan[]} />}
        actionBar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-slate-600">
            <div>
              {totalRows === 0 ? (
                <span>No plans found.</span>
              ) : (
                <span>
                  Showing <span className="font-semibold">{pageStart}</span>–
                  <span className="font-semibold">{pageEnd}</span> of{' '}
                  <span className="font-semibold">{totalRows}</span> plans
                </span>
              )}
            </div>
            {totalRows > 0 && (
              <PageNavigator
                current={pageIndex}
                total={pageCount || 1}
                onChange={handleChangePage}
                onSubmitWithValidation={handleSubmitWithValidation}
                maxVisibleButtons={7}
                className="justify-end"
              />
            )}
          </div>
        }
      >
        <div className="h-full flex flex-col">
          <TableContainer>
            <Table<PlanRow> table={table} selectable />
          </TableContainer>
        </div>
      </ListingLayout>
    </div>
  );
};

export default LandingListPage;
