import { designSchema } from '@/lib/schema'
import type { useForm } from '@formisch/react'

export type BatssFormStore = ReturnType<typeof useForm<typeof designSchema>>
