import { rankings, rankItem } from '@tanstack/match-sorter-utils'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type Row,
  type SortingState,
  useTable
} from '@tanstack/react-table'
import { type ReactElement, useState } from 'react'

import { DataTablePagination } from '@/components/table/data-table-pagination'
import { DataTableToolbar } from '@/components/table/data-table-toolbar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useDesign } from '@/stores/design'
import { DataTableRow } from '@/types/data-table-types'

import { type DataTableFeatures, features } from './data-table-features'

interface DataTableProps<TData extends DataTableRow> {
  title?: string
  description?: string
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  // Columns hidden until the user turns them on from the Columns menu
  hiddenColumns?: string[]
  // A row as it's shown, for the search box (see columns.tsx). Without
  // it, the search matches each column's stored value.
  searchText?: (row: TData) => string
}

// Keeps the checkbox and Created At columns in view while the rest of
// the table scrolls sideways. Sticky cells need an opaque background,
// so the row's translucent hover tint is mixed into it by hand, and a
// border-collapse table drops cell borders on sticky cells, hence the
// inset shadow for the divider.
const STICKY_COLUMN_CLASSES: Record<string, string> = {
  select: 'left-0 w-10 min-w-10 max-w-10',
  createdAt: 'left-10 shadow-[inset_-1px_0_0_var(--border)]'
}

function stickyClassName(columnId: string): string | undefined {
  const position = STICKY_COLUMN_CLASSES[columnId]
  if (!position) return undefined

  return cn(
    'sticky z-10 bg-background',
    'group-hover:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background))]',
    'group-data-[state=selected]:bg-muted',
    position
  )
}

export function DataTable<TData extends DataTableRow>({
  title,
  description,
  columns,
  data,
  hiddenColumns = [],
  searchText
}: DataTableProps<TData>): ReactElement {
  const openResults = useDesign((state) => state.openResults)
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'createdAt',
      desc: true
    }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [userColumnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({})
  const columnVisibility: ColumnVisibilityState = {
    ...Object.fromEntries(hiddenColumns.map((id) => [id, false])),
    ...userColumnVisibility
  }

  const table = useTable({
    features,
    data,
    columns,
    // The search box matches the whole row as displayed when the table
    // knows how (the result is the same for every column it's asked
    // about). The text has to contain what was typed: rankItem's default,
    // letters in order anywhere, matches almost any row's long text.
    globalFilterFn: searchText
      ? (row, _columnId, value) =>
          rankItem(searchText(row.original), value as string, { threshold: rankings.CONTAINS })
            .passed
      : 'fuzzy',
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility
    }
  })

  // While nothing is checked, a row click drills straight into that
  // result. Once the user has started checking rows to compare (the
  // "View Results" multi-select flow in the toolbar), a plain row
  // click toggles that row's checkbox instead of discarding the
  // in-progress selection by navigating away.
  function selectRow(row: Row<DataTableFeatures, TData>): void {
    const hasSelection = table.getSelectedRowModel().rows.length > 0

    if (hasSelection) {
      row.toggleSelected()
      return
    }

    openResults([row.original.id])
  }

  return (
    <div className="flex flex-col gap-4">
      {(title || description) && (
        <div className="flex flex-col gap-1">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={stickyClassName(header.column.id)}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => selectRow(row)}
                  // Reachable and openable from the keyboard too, as on the
                  // batch page. Only the row's own key presses: Space on its
                  // checkbox still just ticks it.
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectRow(row)
                    }
                  }}
                  className="group outline-none hover:cursor-pointer focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={stickyClassName(cell.column.id)}
                      onClick={(e) => {
                        if (cell.column.id === 'select') {
                          e.stopPropagation()
                        }
                      }}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
