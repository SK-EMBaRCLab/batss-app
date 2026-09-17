import type { FormStore } from '@formisch/react'

import { designSchema } from '@/lib/schema'

export type SimulationFormStore = FormStore<typeof designSchema>
