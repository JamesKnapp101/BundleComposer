import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';

export type TableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  height?: number | string;
  empty?: string | React.ReactNode;
  onRowClick?: (row: TData) => void;
  enableSort?: boolean;
  className?: string;
  selectable?: boolean;
  rowSelection?: RowSelectionState;
  setRowSelection?: (updater: React.SetStateAction<RowSelectionState>) => void;
};

export function Table<TData>({
  data,
  columns,
  loading,
  height = 'auto',
  empty = 'No data',
  onRowClick,
  enableSort = true,
  className,
  selectable,
  rowSelection,
  setRowSelection,
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  //  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  function withSelectionColumn<T>(cols: ColumnDef<T, any>[]): ColumnDef<T, any>[] {
    const selCol: ColumnDef<T, any> = {
      id: '_select',
      size: 36,
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
    };
    return [selCol, ...cols];
  }

  const IndeterminateCheckbox = ({
    indeterminate,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
    }, [indeterminate]);
    return (
      <input
        ref={ref}
        type="checkbox"
        {...props}
        aria-checked={indeterminate ? 'mixed' : props.checked ? 'true' : 'false'}
      />
    );
  };

  const table = useReactTable({
    data,
    columns: selectable ? withSelectionColumn(columns) : columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original);

  console.log('selectedRows: ', selectedRows);

  const rows = table.getRowModel().rows;
  const isEmpty = !loading && rows.length === 0;

  const ColGroup = () => (
    <colgroup>
      {table.getFlatHeaders().map((h) => (
        <col key={h.id} style={{ width: h.column.columnDef.size as number | undefined }} />
      ))}
    </colgroup>
  );

  return (
    <div className="relative rounded-md border border-slate-200 bg-white">
      <table className="w-full text-sm table-fixed border-separate [border-spacing:0]">
        <ColGroup />
        <thead className="bg-slate-50 border-b border-slate-200">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const dir = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left font-medium text-slate-700 select-none"
                  >
                    {canSort ? (
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {dir === 'asc' ? ' ▲' : dir === 'desc' ? ' ▼' : ''}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
      </table>
      <div
        className="max-h-[85vh] overflow-auto [scrollbar-gutter:stable_both-edges]"
        style={{ height: typeof height === 'number' ? height : undefined }}
      >
        <table className="w-full text-sm table-fixed border-separate [border-spacing:0]">
          <ColGroup />
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-1 py-2 left-auto">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
