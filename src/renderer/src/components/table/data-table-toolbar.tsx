import { type ReactTable } from '@tanstack/react-table'
import { useDebouncedCallback } from '@tanstack/react-pacer/debouncer'
import { FileChartColumn, Search, X } from 'lucide-react'
import { Dispatch, SetStateAction, useEffect, useState, type ReactElement } from 'react'

import { type DataTableFeatures } from '@/components/results/data-table-features'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'
import { DataTableRow } from '@/types/data-table-types'

import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'

interface DataTableToolbarProps<TData extends DataTableRow> {
  table: ReactTable<DataTableFeatures, TData>
  globalFilter: string
  setGlobalFilter: Dispatch<SetStateAction<string>>
}

export function DataTableToolbar<TData extends DataTableRow>({
  table,
  globalFilter,
  setGlobalFilter
}: DataTableToolbarProps<TData>): ReactElement {
  const navigate = useNavigation((state) => state.navigate)
  const selectResults = useDesign((state) => state.selectResults)
  const selectResult = useDesign((state) => state.selectResult)
  const isFiltered = table.state.columnFilters.length > 0
  const selected = table.getSelectedRowModel().rows
  const resultCount = table.getFilteredRowModel().rows.length

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
        <InputGroup className="max-w-xs">
          <DebouncedInput
            value={globalFilter}
            onChange={(value) => setGlobalFilter(String(value))}
            placeholder="Search all columns..."
            className="pl-8"
          />
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">{resultCount} results</InputGroupAddon>
        </InputGroup>
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

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.ComponentProps<typeof Input>, 'onChange'>) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const debouncedOnChange = useDebouncedCallback(onChange, { wait: debounce })

  return (
    <InputGroupInput
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        debouncedOnChange(e.target.value)
      }}
    />
  )
}
