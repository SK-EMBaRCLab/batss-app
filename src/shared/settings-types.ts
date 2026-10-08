// Small shared response shape for settings writes that can fail
// validation (e.g. a typed output path that doesn't exist on disk).
export type SetOutputPathResult = { saved: boolean; error?: string }
