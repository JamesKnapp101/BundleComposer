import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Table as ReactTable,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  type InputHTMLAttributes,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/utils/cn';

type BaseProps<TData> = {
  loading?: boolean;
  height?: number | string;
  empty?: string | React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
  selectable?: boolean;
  rowSelection?: RowSelectionState;
  setRowSelection?: (updater: React.SetStateAction<RowSelectionState>) => void;
};

type WithInstance<TData> = BaseProps<TData> & {
  table: ReactTable<TData>;
  data?: never;
  columns?: never;
};

type WithDef<TData> = BaseProps<TData> & {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  table?: never;
};

export type TableProps<TData> = WithInstance<TData> | WithDef<TData>;

export function Table<TData>(props: TableProps<TData>) {
  const {
    loading,
    height = 'auto',
    empty = 'No data',
    onRowClick,
    className,
    selectable,
    rowSelection,
    setRowSelection,
  } = props;

  const table =
    'table' in props && props.table
      ? props.table
      : useInternalTable(props as WithDef<TData>, selectable, rowSelection, setRowSelection);

  const rows = table.getRowModel().rows;
  const isEmpty = !loading && rows.length === 0;
  const hasInjectedSelectCol = table.getAllLeafColumns().some((c) => c.id === '_select');
  const shouldRenderSelect = !!selectable && !hasInjectedSelectCol;

  const ColGroup = useMemo(
    () =>
      function ColGroup() {
        return (
          <colgroup>
            {shouldRenderSelect && <col style={{ width: 36 }} />} {/* injected select col */}
            {table.getFlatHeaders().map((h) => (
              <col key={h.id} style={{ width: h.column.columnDef.size as number | undefined }} />
            ))}
          </colgroup>
        );
      },
    [table, shouldRenderSelect],
  );

  return (
    <div className={cn('relative rounded-md border border-slate-200 bg-white', className)}>
      <table className="w-full text-sm table-fixed border-separate [border-spacing:0]">
        <ColGroup />
        <thead className="bg-slate-200 border-b border-slate-300">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {shouldRenderSelect && (
                <th className="px-3 py-2 w-9">
                  <IndeterminateCheckbox
                    checked={table.getIsAllRowsSelected()}
                    indeterminate={table.getIsSomeRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                  />
                </th>
              )}
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
                        {dir === 'asc' && <ChevronUp className="inline-block w-4 h-4 opacity-70" />}
                        {dir === 'desc' && (
                          <ChevronDown className="inline-block w-4 h-4 opacity-70" />
                        )}
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
            {isEmpty ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={table.getAllLeafColumns().length + (shouldRenderSelect ? 1 : 0)}
                >
                  {empty}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-slate-100 rounded-md even:bg-slate-200 hover:bg-slate-250',
                    row.getIsSelected() && 'bg-blue-100 hover:bg-blue-100 even:bg-blue-200',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original as TData) : undefined}
                >
                  {shouldRenderSelect && (
                    <td className="px-1 py-2 w-9">
                      <IndeterminateCheckbox
                        checked={row.getIsSelected()}
                        indeterminate={row.getIsSomeSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-1 py-2 left-auto pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useInternalTable<TData>(
  props: WithDef<TData>,
  selectable?: boolean,
  rowSelection?: RowSelectionState,
  setRowSelection?: (updater: SetStateAction<RowSelectionState>) => void,
) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const withSelectionColumn = (cols: ColumnDef<TData, any>[]): ColumnDef<TData, any>[] => {
    if (!selectable) return cols;
    const selCol: ColumnDef<TData, any> = {
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
  };

  return useReactTable<TData>({
    data: props.data,
    columns: withSelectionColumn(props.columns),
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
}

function IndeterminateCheckbox({
  indeterminate,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      className="ml-1 accent-indigo-500"
      type="checkbox"
      {...props}
      aria-checked={indeterminate ? 'mixed' : props.checked ? 'true' : 'false'}
    />
  );
}
