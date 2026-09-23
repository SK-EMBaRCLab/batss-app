// Every IPC channel name in the app, in one place. Both the preload
// bridge (src/preload/index.ts) and every main-process handler
// (src/main/ipc/*.ts) import from here instead of typing the string
// twice — a typo on either side becomes a compile error instead of a
// request that silently never resolves.
export const IPC = {
  app: {
    version: 'app:version',
    reload: 'app:reload',
    quit: 'app:quit'
  },
  runtime: {
    check: 'runtime:check',
    update: 'runtime:update',
    log: 'runtime:log'
  },
  design: {
    dirty: 'design:dirty',
    saveResult: 'design:saveResult',
    loadResult: 'design:loadResult',
    saveRequested: 'design:save-requested',
    closeConfirmed: 'design:close-confirmed',
    canLeave: 'design:can-leave'
  },
  simulation: {
    run: 'simulation:run',
    cancel: 'simulation:cancel',
    log: 'simulation:log'
  },
  theme: {
    get: 'theme:get',
    set: 'theme:set',
    updated: 'theme:updated'
  },
  settings: {
    getOutputPath: 'settings:getOutputPath',
    setOutputPath: 'settings:setOutputPath',
    selectOutputDirectory: 'settings:selectOutputDirectory'
  },
  batch: {
    run: 'batch:run',
    cancel: 'batch:cancel',
    update: 'batch:update',
    rowDone: 'batch:row-done',
    log: 'batch:log'
  },
  engine: {
    get: 'engine:get',
    state: 'engine:state'
  }
} as const
