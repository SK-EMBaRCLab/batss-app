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
      <DataTable
        title="Simulation Runs"
        description="The following table allows you to view all of the simulations you have performed
        for your trial to date. The filtering tools will enable you to find specific simulations of interest.
        You can select any number of simulations and click View Results to narrow to a smaller list of simulations."
        columns={columns}
        data={data}
      />
    </div>
  )
}
