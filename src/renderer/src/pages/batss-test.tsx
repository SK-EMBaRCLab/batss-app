import { useEffect, useRef, useState } from 'react'
import { Form, Field as FormischField, useForm } from '@formisch/react'
import type { SubmitHandler } from '@formisch/react'
import * as v from 'valibot'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field as ShadcnField,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldTitle,
  FieldContent
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { BatssRunInput, BatssRunResult } from '@/shared/batss-types'

const requiredNumber = (label: string) =>
  v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((value) => {
      if (typeof value === 'number') return value

      const trimmed = value.trim()

      if (trimmed === '') {
        return NaN
      }

      return Number(trimmed)
    }),
    v.number(`${label} must be a number.`)
  )

const designSchema = v.object({
  // Input 1: Primary outcome direction
  primaryOutcome: v.picklist(['A', 'B'], 'Please select A (positive) or B (negative).'),

  // Input 2: Probability of primary outcome
  probability: v.pipe(
    requiredNumber('Probability'),
    v.minValue(0, 'Probability must be at least 0.'),
    v.maxValue(1, 'Probability must be at most 1.')
  ),

  // Input 3: Superiority decision rule
  decisionRule: v.object({
    deltaEff: requiredNumber('Delta efficiency'),

    b: requiredNumber('b')
  }),

  // Input 4: Maximum sample size (N)
  N: v.pipe(requiredNumber('Maximum sample size'), v.integer(), v.minValue(1)),

  // Input 5: Burn-in (m0)
  m0: v.pipe(requiredNumber('Burn-in'), v.integer(), v.minValue(1)),

  // Input 6: Patients recruited between interim analyses (m)
  m: v.pipe(requiredNumber('Patients between interim analyses'), v.integer(), v.minValue(1)),

  // Input 7: Number of simulations (R)
  R: v.pipe(requiredNumber('Number of simulations'), v.integer(), v.minValue(1))
})

const primaryOutcomes = [
  {
    id: 'A',
    title: 'Positive',
    description: 'Is your primary outcome a positive (A) event'
  },
  {
    id: 'B',
    title: 'Negative',
    description: 'Is your primary outcome a negative (B) event'
  }
]

export default function BatssTest() {
  const form = useForm({
    schema: designSchema,
    validate: 'blur',
    revalidate: 'input',
    initialInput: {
      primaryOutcome: 'A',
      probability: 0.1,
      decisionRule: {
        deltaEff: 0.05,
        b: 0.2
      },
      N: 216,
      m0: 60,
      m: 12,
      R: 3
    }
  })

  const [result, setResult] = useState<BatssRunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const logScrollRef = useRef<HTMLDivElement>(null)

  // Subscribe once; window.batss.onLog streams every line of R/INLA
  // output from a batss.glm() run as it happens, same pattern as the
  // runtime bootstrap screen's log panel.
  useEffect(() => {
    const unsubscribe = window.batss.onLog((line) => {
      setLogs((prev) => [...prev, line])
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const viewport = logScrollRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    )

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [logs])

  // Fix: this used to be a separate, never-called runTest() function
  // (it invoked window.batss.runExample() with no arguments at all,
  // while the actual submit handler only console.logged the validated
  // output). Wired together here: validated form output is mapped to
  // BatssRunInput and sent to the real batss.glm() run.
  const handleSubmit: SubmitHandler<typeof designSchema> = async (output) => {
    setIsRunning(true)
    setLogs([])
    setResult(null)

    const input: BatssRunInput = {
      primaryOutcome: output.primaryOutcome as 'A' | 'B',
      probability: output.probability,
      deltaEff: output.decisionRule.deltaEff,
      b: output.decisionRule.b,
      N: output.N,
      m0: output.m0,
      m: output.m,
      R: output.R
    }

    try {
      const response = await window.batss.runExample(input)
      setResult(response)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>BATSS Runtime Test</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form of={form} onSubmit={handleSubmit} className="space-y-4">
            <FormischField of={form} path={['primaryOutcome']}>
              {(field) => (
                <FieldSet>
                  <FieldLegend>Primary Outcome</FieldLegend>
                  <RadioGroup value={field.input} onValueChange={field.onChange}>
                    {primaryOutcomes.map((outcome) => (
                      <FieldLabel key={outcome.id} htmlFor={`form-radiogroup-${outcome.id}`}>
                        <ShadcnField orientation="horizontal" data-invalid={field.errors !== null}>
                          <FieldContent>
                            <FieldTitle>{outcome.title}</FieldTitle>
                            <FieldDescription>{outcome.description}</FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value={outcome.id}
                            id={`form-radiogroup-${outcome.id}`}
                            aria-invalid={field.errors !== null}
                          />
                        </ShadcnField>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                  {field.errors && (
                    <FieldError errors={field.errors.map((message) => ({ message }))} />
                  )}
                </FieldSet>
              )}
            </FormischField>
            <FormischField of={form} path={['probability']}>
              {(field) => (
                <ShadcnField data-invalid={field.errors !== null}>
                  <FieldLabel htmlFor="form-probabilityOutcome">
                    Probability of primary outcome
                  </FieldLabel>

                  <Input
                    {...field.props}
                    type="number"
                    id="form-probabilityOutcome"
                    step="0.01"
                    value={field.input ?? ''}
                    aria-invalid={field.errors !== null}
                    autoComplete="off"
                  />

                  {field.errors && (
                    <FieldError errors={field.errors.map((message) => ({ message }))} />
                  )}
                </ShadcnField>
              )}
            </FormischField>

            <FormischField of={form} path={['decisionRule', 'deltaEff']}>
              {(field) => (
                <NumberInputField id="form-deltaEff" label="Delta efficiency" field={field} />
              )}
            </FormischField>

            <FormischField of={form} path={['decisionRule', 'b']}>
              {(field) => <NumberInputField id="form-b" label="b" field={field} />}
            </FormischField>

            <FormischField of={form} path={['N']}>
              {(field) => (
                <NumberInputField id="form-N" label="Maximum sample size (N)" field={field} />
              )}
            </FormischField>

            <FormischField of={form} path={['m0']}>
              {(field) => <NumberInputField id="form-m0" label="Burn-in (m0)" field={field} />}
            </FormischField>

            <FormischField of={form} path={['m']}>
              {(field) => (
                <NumberInputField
                  id="form-m"
                  label="Patients between interim analyses (m)"
                  field={field}
                />
              )}
            </FormischField>

            <FormischField of={form} path={['R']}>
              {(field) => (
                <NumberInputField id="form-r" label="Number of simulations (R)" field={field} />
              )}
            </FormischField>

            <Button type="submit" disabled={isRunning}>
              {isRunning ? 'Running…' : 'Run simulation'}
            </Button>
          </Form>

          {(isRunning || logs.length > 0) && (
            <ScrollArea
              ref={logScrollRef}
              className="h-48 rounded-md border border-border bg-black p-3"
            >
              <div className="font-mono text-xs text-green-400">
                {logs.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">
                    {line}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {result && (
            <pre className="rounded-md bg-muted p-4 text-sm">{JSON.stringify(result, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NumberInputField({ id, label, field }: { id: string; label: string; field: any }) {
  return (
    <ShadcnField data-invalid={field.errors !== null}>
      <FieldLabel>{label}</FieldLabel>

      <Input
        {...field.props}
        id={id}
        type="number"
        value={field.input ?? ''}
        aria-invalid={field.errors !== null}
      />

      {field.errors && <FieldError errors={field.errors.map((message) => ({ message }))} />}
    </ShadcnField>
  )
}
