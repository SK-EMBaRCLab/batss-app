// src/main/runtime/types.ts
//
// Re-exported from the shared module so main-process code can keep
// importing from './types' without every file needing to know the
// types actually live in src/shared. Do not redeclare these shapes here.

export type {
  RuntimeStatus,
  RuntimeUpdate,
  RuntimePackage,
  RuntimeResult
} from '../../shared/runtime-types'
