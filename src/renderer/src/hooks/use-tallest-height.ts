import { useEffect, useRef, useState } from 'react'

/**
 * Natural height of the tallest of `count` elements, kept up to date as
 * any of them resizes (e.g. the Outcome Parameters step changing with
 * the outcome type). Attach `ref(index)` to each element to measure.
 */
export function useTallestHeight(count: number): {
  ref: (index: number) => (el: HTMLDivElement | null) => void
  tallest: number
} {
  const elements = useRef<(HTMLDivElement | null)[]>(Array(count).fill(null))
  const [tallest, setTallest] = useState(0)

  useEffect(() => {
    const measure = (): void =>
      setTallest(Math.max(0, ...elements.current.map((el) => el?.offsetHeight ?? 0)))
    const observer = new ResizeObserver(measure)
    elements.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return {
    ref: (index) => (el) => {
      elements.current[index] = el
    },
    tallest
  }
}
