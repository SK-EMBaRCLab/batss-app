import { type ReactElement } from 'react'

import { columns } from '@/components/results/columns'
import { DataTable } from '@/components/results/data-table'
import { ResultsEmpty } from '@/components/results/results-empty'
import { useDesign } from '@/stores/design'

export default function Table(): ReactElement {
  const design = useDesign((state) => state.design)
  const data = design?.results || []

  if (!data || data.length === 0) {
    return <ResultsEmpty />
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
