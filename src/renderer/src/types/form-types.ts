import type { useForm } from '@formisch/react'

import { designSchema } from '@/lib/schema'

export type SimulationFormStore = ReturnType<typeof useForm<typeof designSchema>>
