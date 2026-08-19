import { type ReactTable } from '@tanstack/react-table'
import { FileChartColumn, X } from 'lucide-react'
import { type ReactElement } from 'react'

import { type DataTableFeatures } from '@/components/results/data-table-features'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'
import { DataTableRow } from '@/types/data-table-types'

import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData extends DataTableRow> {
  table: ReactTable<DataTableFeatures, TData>
}

export function DataTableToolbar<TData extends DataTableRow>({
  table
}: DataTableToolbarProps<TData>): ReactElement {
  const navigate = useNavigation((state) => state.navigate)
  const selectResults = useDesign((state) => state.selectResults)
  const selectResult = useDesign((state) => state.selectResult)
  const isFiltered = table.state.columnFilters.length > 0
  const selected = table.getSelectedRowModel().rows

  function viewResults(): void {
    if (selected.length === 0) return

    const ids = selected.map((row) => row.original.id)
    const lastId = ids.at(-1)

    if (!lastId) return

    selectResults(ids)
    selectResult(lastId)
    navigate('results')
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn('outcomeType')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('outcomeType')?.setFilterValue(event.target.value)}
          className="h-8 w-37.5 lg:w-62.5"
        />
        {table.getColumn('outcomeType') && (
          <DataTableFacetedFilter column={table.getColumn('outcomeType')} title="Outcome Type" />
        )}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="ml-auto h-8"
          disabled={selected.length === 0}
          onClick={() => viewResults()}
        >
          <FileChartColumn />
          View Results
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
