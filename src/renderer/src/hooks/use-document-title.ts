import { useEffect } from 'react'

import { useDesign } from '@/stores/design'

const APP_NAME = 'Albatross'

// Two complementary "is this edited?" signals:
//  - document.title drives the title/taskbar/dock label on every
//    platform, with a leading "• " when dirty (same convention VS
//    Code's own window title uses).
//  - setDocumentEdited is the real native macOS mechanism — a dot in
//    the red traffic-light close button — which is what Mac users
//    actually recognize. No-op on Windows/Linux.
export function useDocumentTitle(): void {
  const name = useDesign((state) => state.design?.name)
  const isDirty = useDesign((state) => state.isDirty)

  useEffect(() => {
    document.title = name ? `${isDirty ? '• ' : ''}${name} — ${APP_NAME}` : APP_NAME
  }, [name, isDirty])

  useEffect(() => {
    window.app.setDocumentEdited(!!name && isDirty)
  }, [name, isDirty])
}
