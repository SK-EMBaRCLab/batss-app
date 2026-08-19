import { type ReactElement } from 'react'

import { columns } from '@/components/results/columns'
import { DataTable } from '@/components/results/data-table'
import { useDesign } from '@/stores/design'

export default function Table(): ReactElement {
  const design = useDesign((state) => state.design)
  const data = design?.results || []
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
