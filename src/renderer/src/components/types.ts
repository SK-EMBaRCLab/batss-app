import { designSchema } from '@/lib/schema'
import type { useForm } from '@formisch/react'

export type SimulationFormStore = ReturnType<typeof useForm<typeof designSchema>>
