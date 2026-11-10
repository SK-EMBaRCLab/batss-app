# Adding a new outcome type to BATSS Studio

This guide walks you through adding a new kind of trial outcome to BATSS Studio, alongside the two it supports today: **binary** (an event happens or not) and **continuous** (a measurement such as blood pressure). It uses a **count** outcome as a worked example throughout, but the same steps apply to any outcome BATSS can model.

You don't need to know the codebase already. You do need to be comfortable reading TypeScript and a little R, and to have the app running locally (see the README).

Plan on a few days. Most of the work is small and repetitive: the same new field has to be taught to about a dozen places. The guide lists all of them, in an order where the app keeps working after each step.

---

## Contents

1. [Background: what an outcome type is](#1-background-what-an-outcome-type-is)
2. [Before you code: decide the statistics](#2-before-you-code-decide-the-statistics)
3. [How a design travels through the app](#3-how-a-design-travels-through-the-app)
4. [The tools you'll meet](#4-the-tools-youll-meet)
5. [Step by step](#5-step-by-step)
6. [Testing your work](#6-testing-your-work)
7. [Checklist](#7-checklist)
8. [Common mistakes](#8-common-mistakes)

---

## 1. Background: what an outcome type is

A clinical trial measures something about each patient: did they have a heart attack (yes/no), what is their blood pressure (a number), how many seizures did they have (a count). That measurement is the **outcome**, and its kind decides how it's analysed.

BATSS Studio simulates many trials with the R package **BATSS**. BATSS analyses each simulated trial with a **generalised linear model (GLM)**:

```
link(mean outcome) = beta[1] + beta[2] × (patient is in the experimental group)
```

- **`beta[1]`, the intercept:** the control group's mean outcome, on the link's scale.
- **`beta[2]`, the group effect:** how much the experimental treatment changes it. This is the **treatment effect** the trial is looking for.
- **The family** is the type of random variation in the outcome: `binomial` for yes/no, `gaussian` (normal) for measurements, `poisson` for counts, and so on.
- **The link** is the function that maps the mean outcome onto the scale where the effect is a simple sum: `logit` for probabilities, `identity` for measurements, `log` for counts.

What the two current outcome types use:

|                                        | Binary                                  | Continuous                                        |
| -------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Family                                 | `binomial`                              | `gaussian`                                        |
| Link                                   | `logit`                                 | `identity`                                        |
| R function that simulates each patient | `rbinom`                                | `rnorm`                                           |
| What the user enters                   | control event probability, odds ratio   | control mean, standard deviation, mean difference |
| `beta`                                 | `c(logit(probability), log(oddsRatio))` | `c(meanOutcome, meanDiff)`                        |
| Effect measure (symbol)                | odds ratio (OR)                         | mean difference (MD)                              |
| "No effect" value                      | 1                                       | 0                                                 |
| Margins compared on                    | the log scale: `log(margin)`            | as entered                                        |

Adding an outcome type means filling in one more column of that table, then teaching the app about it.

**Which outcome types can be added this way?** BATSS's `batss.glm()` accepts any family INLA supports, but BATSS's authors have only tested `gaussian`, `binomial`, `poisson` and `nbinomial` (negative binomial). Stick to those unless a statistician has checked another one. **Ordinal** outcomes, which the app lists as "under development", are not a GLM family in `batss.glm()`. They need a different model and are outside this guide.

---

## 2. Before you code: decide the statistics

Sit down with a statistician and fill in this table for your outcome. Every later step uses it. Here it is filled in for the worked example, **a count outcome** (for example, the number of exacerbations per patient):

| Question                                             | Count outcome (example)                               |
| ---------------------------------------------------- | ----------------------------------------------------- |
| Name in the code                                     | `count`                                               |
| Name users see                                       | Count                                                 |
| BATSS family                                         | `poisson`                                             |
| Link                                                 | `log`                                                 |
| R function that simulates each patient               | `rpois`                                               |
| Extra settings that R function needs (`var.control`) | none                                                  |
| What the user enters                                 | the control group's mean count, and the rate ratio    |
| Allowed values                                       | mean count > 0; rate ratio > 0                        |
| `beta`                                               | `c(log(meanCount), log(rateRatio))`                   |
| Effect measure and symbol                            | incidence rate ratio, **IRR**                         |
| "No effect" value                                    | 1                                                     |
| Margins compared on                                  | the log scale, `log(margin)`, as for odds ratios      |
| Margin allowed values                                | > 0 (you can't take the log of 0 or less)             |
| Direction ("greater" or "less")                      | "less" when the rate ratio is below 1, else "greater" |
| Default margin for a new rule                        | 1                                                     |

Two points to be careful with:

- **The scale.** If the effect is a ratio (odds ratio, rate ratio), BATSS works with its **log**, so `beta[2]` and the margins are `log(...)` and must be above 0. If the effect is a difference (mean difference), they're used as entered and can be any number.
- **The direction.** BATSS needs to know whether a "good" effect makes `beta[2]` bigger or smaller. The app works this out from the sign of `beta[2]`: a ratio below 1 or a negative difference means "less". The decision rules, their formulas and the charts all follow this.

---

## 3. How a design travels through the app

It helps to know the path a design takes, because the new outcome has to be understood at each stop:

```
 The form (renderer)            src/renderer/src/components/simulation/
   │  checked by                src/renderer/src/lib/schema.ts
   ▼
 Saved in the design file       src/shared/design-file-schema.ts
   │
   ▼  "Run" sends it over IPC
 Checked again (main process)   src/shared/simulation-input-schema.ts
   │
   ▼
 Model chosen, R started        src/main/services/simulation.service.ts
   │                            src/shared/outcome-model.ts
   ▼
 R runs BATSS                   resources/r/batss-simulation.R
   │
   ▼
 Results shown                  src/renderer/src/components/results/
                                (charts, tables, Word report, R script export)
```

Batch runs take a CSV file instead of the form (`src/renderer/src/lib/batch-mapper.ts`) and then follow the same path from "checked again".

The app has two halves, as every Electron app does:

- **The renderer** (`src/renderer/`) is the window: React components, the form, the charts.
- **The main process** (`src/main/`) runs in the background: it starts R, reads and writes files, and checks everything the window sends it.
- **Shared code** (`src/shared/`) is used by both, for example the types and the validation rules.

**Good news: the results side doesn't change.** BATSS reports every outcome type the same way, as how often each simulated trial ended superior, futile or inconclusive, plus sample sizes. The results tables, the bar chart and the sample size statistics already work for any outcome.

---

## 4. The tools you'll meet

| Tool                                             | What it does here                                                                                                                                    | Where to read more      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **TypeScript**                                   | JavaScript with types. The compiler is your best friend in this task: after you add the new type, it points at many places that still need updating. | typescriptlang.org/docs |
| **valibot** (`v.object`, `v.pipe`, `v.variant`…) | Describes what valid data looks like, and checks it. Used for the form, the design file and the run check.                                           | valibot.dev             |
| **formisch** (`useField`, `Field`)               | Keeps track of the form's values and errors.                                                                                                         | formisch.dev            |
| **React**                                        | The window's components.                                                                                                                             | react.dev               |
| **Vitest**                                       | The tests (`*.test.ts` files next to the code).                                                                                                      | vitest.dev              |
| **R / BATSS / INLA**                             | Run the simulations.                                                                                                                                 | `?batss.glm` in R       |

Useful commands, from the project folder:

```bash
npm run dev        # start the app
npm run check      # types, lint, formatting and every test — run this often
npm test           # only the tests
npm run typecheck  # only the TypeScript compiler
```

---

## 5. Step by step

Work through these in order. Run `npm run check` after each step; the compiler errors it shows are a to-do list, not a sign something is broken.

A quick way to find every place that knows about outcome types is to search the code for the existing ones:

```bash
grep -rnE "'binary'|'continuous'|outcomeType ===" src resources
```

Every match is a place where you'll probably need to add your outcome.

The code snippets below are for the count example. Adapt names and maths to your outcome.

### Step 1. Add the type to the list of outcome types

**File:** `src/shared/design-rules.ts`

`OUTCOME_TYPES` is the single list of outcome types. The types, the design file check and the form all read it.

```ts
export const OUTCOME_TYPES = ['binary', 'continuous', 'count', 'ordinal'] as const
```

### Step 2. Describe the new outcome's data

**File:** `src/shared/simulation-types.ts`

Each outcome type has its own shape of run input. Add one for yours, next to `BinarySimulationRunInput` and `ContinuousSimulationRunInput`:

```ts
type CountSimulationRunInput = {
  outcomeType: 'count'

  meanCount: number // the control group's mean count
  rateRatio: number // the target treatment effect
} & SimulationRunCommon
```

Then add it to the union:

```ts
export type SimulationRunInput =
  | BinarySimulationRunInput
  | ContinuousSimulationRunInput
  | CountSimulationRunInput
  | OrdinalSimulationRunInput
```

And add the new fields to `DesignInput` further down the same file. Here they're optional, because a design being filled in may not have them yet:

```ts
  meanCount?: number
  rateRatio?: number
```

### Step 3. Name the new fields

**File:** `src/shared/field-labels.ts`

Every field's name is written here once and used everywhere: the form, the review step, the results table, the Word report and every error message. **Don't type a field's name anywhere else.**

```ts
// In FIELD_LABELS
  meanCount: 'Mean count in the control arm',
  rateRatio: 'Rate ratio for the treatment effect',

// In SHORT_FIELD_LABELS (the runs table's column headers)
  meanCount: 'Control Mean Count',
  rateRatio: 'Rate Ratio',
```

### Step 4. Write the rules for the new fields

**File:** `src/shared/design-rules.ts`

`NUMBER_FIELDS` holds each number field's rules, with the error message for each. The form and the main process both use them, so they always agree.

```ts
  meanCount: v.pipe(
    finiteNumber(L.meanCount),
    v.gtValue(0, `${L.meanCount} must be greater than 0.`)
  ),
  rateRatio: v.pipe(
    finiteNumber(L.rateRatio),
    v.gtValue(0, `${L.rateRatio} must be greater than 0.`)
  ),
```

The same file has `CROSS_FIELD_RULES`, rules that involve more than one field. One of them, `oddsRatioMargin`, requires a margin above 0 because R takes its log. A rate ratio needs exactly the same rule. You can reuse it, but its message says "for an odds ratio". The tidy fix is to rename it to something like `ratioMargin`, with the message "… must be greater than 0 for a ratio.", and update the places that use it (the compiler will list them).

### Step 5. Let the design file save and load the new fields

**File:** `src/shared/design-file-schema.ts`

When a design is opened, its file is checked against `designInputFileSchema`. **Any field not listed there is silently dropped**, so if you forget this step, designs lose their count settings when saved and reopened.

```ts
  meanCount: v.optional(v.number()),
  rateRatio: v.optional(v.number()),
```

Keep them optional, so design files saved before your change still open.

Then add a test in `src/shared/design-file-schema.test.ts` that a design with the new fields saves and loads with them intact.

### Step 6. Choose the model R uses

**File:** `src/shared/outcome-model.ts`

This maps each outcome type to the BATSS family, link and R function. The `switch` has no `default` on purpose: TypeScript refuses to compile until every outcome type is handled, so you can't forget it.

```ts
export type OutcomeModel = {
  family: 'binomial' | 'gaussian' | 'poisson'
  link: 'logit' | 'identity' | 'log'
  varY: 'rbinom' | 'rnorm' | 'rpois'
}

// in outcomeModel()
    case 'count':
      return { family: 'poisson', link: 'log', varY: 'rpois' }
```

Add a test in `src/shared/outcome-model.test.ts`.

### Step 7. Work out the effect's direction

**File:** `src/shared/effect-direction.ts`

`effectDirection()` decides "greater" or "less" from the treatment effect. Add your outcome's rule, and add its field to the `EffectInput` type at the top:

```ts
if (input.outcomeType === 'count') {
  return toNumber(input.rateRatio) < 1 ? 'less' : 'greater'
}
```

Add cases to `src/shared/effect-direction.test.ts`, including exactly 1, which counts as "greater".

### Step 8. Accept the outcome in the main process's check

**File:** `src/shared/simulation-input-schema.ts`

Before anything reaches R, the main process checks the run's input itself, so a bug in the window or a hand-made CSV can't send R nonsense. This check **only accepts what the R script can actually run**, so this is the switch that makes your outcome runnable.

Add a schema next to `binaryInputSchema` and `continuousInputSchema`. For a ratio effect, copy the binary one's margin check (`v.rawCheck`):

```ts
const countInputSchema = v.pipe(
  v.object({
    outcomeType: v.literal('count'),
    meanCount: NUMBER_FIELDS.meanCount,
    rateRatio: NUMBER_FIELDS.rateRatio,
    ...commonFields
  }),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return
    const failing = dataset.value.decisionRules.find((rule) => !ratioMargin.holds(rule))
    if (failing) addIssue({ message: ratioMargin.message(failing) })
  })
)
```

Then add it to the `v.variant(...)` list and update the message:

```ts
;([binaryInputSchema, continuousInputSchema, countInputSchema],
  'Only binary, continuous and count outcomes are supported.')
```

Add tests to `src/shared/simulation-input-schema.test.ts`: a valid count run passes; a mean count of 0 or a margin of 0 is refused with the right message.

You don't need to change `src/main/services/simulation.service.ts`. It already sends R the whole input plus the model from step 6, so `meanCount` and `rateRatio` reach R automatically.

### Step 9. Teach the R script

**File:** `resources/r/batss-simulation.R`

The app runs this script for every simulation. It reads the input as JSON (`input$meanCount`, `input$rateRatio`, …). Three places need your outcome.

1. **The simulation function** (the `varY <- switch(...)` near the top):

   ```r
   varY <- switch(
     input$varY,
     rbinom = rbinom,
     rnorm = rnorm,
     rpois = rpois,
     stop("Unsupported outcome distribution")
   )
   ```

2. **The model's values** (the `if (input$outcomeType == "binary") … else if …` block). Add a branch before the final `else`:

   ```r
   } else if (input$outcomeType == "count") {
     # rpois needs no settings beyond the mean, which BATSS supplies
     varControl <- NULL
     beta <- c(
       log(input$meanCount),
       log(input$rateRatio)
     )
     # Rate ratio margins are compared on the log scale, like beta[2]
     to_delta <- function(margin) log(margin)
   }
   ```

   BATSS works out each patient's mean from `beta` and the link, then calls the simulation function with it, so `rpois` gets its `lambda` from BATSS. `var.control` is only for the function's _other_ settings, like `size = 1` for `rbinom` or `sd` for `rnorm`.

   Before you rely on `varControl <- NULL`, check it in R (step 6 of "Testing" below). If BATSS refuses `NULL`, use `list()`.

3. **Nothing else.** The rest of the script (the decision rules, `batss.glm()`, reading the results) is the same for every outcome.

### Step 10. Teach the R script export

**File:** `src/shared/r-script.ts`

"Export R script" on the results page writes a standalone script that does the same `batss.glm()` call as step 9, with the values written in. **The two must stay in step:** a comment at the top of each file says so.

In `runRScript()`:

- Update the "can't be exported" check at the top so it lets `count` through.
- `symbol` is `'OR'` or `'MD'`; add `'IRR'` for count.
- The `delta` helper takes the log for binary outcomes; make it take the log for count too.
- Add a branch to the `outcome` lines, the part that writes `beta` and `var_control`:

  ```ts
  ;[
    '# Count outcome, modelled by Poisson regression',
    `mean_count <- ${rNumber(input.meanCount)}  # in the control group`,
    `rate_ratio <- ${rNumber(input.rateRatio)}  # target treatment effect`,
    '',
    '# Intercept and the group effect, on the log scale',
    'beta <- c(log(mean_count), log(rate_ratio))',
    'var_control <- NULL'
  ]
  ```

The file currently uses `binary ? … : …` in a few places, which only works for two outcome types. With a third, turn those into a `switch` on `input.outcomeType`.

Add a test to `src/shared/r-script.test.ts`, like the binary and continuous ones.

### Step 11. Add the outcome to the form's checks

**File:** `src/renderer/src/lib/schema.ts`

The form has its own schema, because what users type arrives as text and has to be turned into numbers first (that's what `typed(...)` does). Add a schema next to `binaryDesignSchema` and `continuousDesignSchema`:

```ts
const countDesignSchema = v.object({
  outcomeType: v.literal('count'),
  meanCount: typed(NUMBER_FIELDS.meanCount),
  rateRatio: typed(NUMBER_FIELDS.rateRatio),
  ...commonDesignFields
})
```

Then, in the same file:

- Add it to the `designVariants` list.
- `marginCheckAt` only checks the margin for binary outcomes (`data.outcomeType !== 'binary' || …`). Make it check count outcomes too.
- `defaultDecisionRule()` gives a new rule margin 0 for continuous outcomes and 1 otherwise. That's right for count (no effect is 1), but check it for your outcome.
- `initialDesignInput`: add `meanCount: undefined` and `rateRatio: undefined`, with a `// Count` comment like the others.

Add tests to `src/renderer/src/lib/schema.test.ts`.

### Step 12. Make it selectable, with help text

**File:** `src/renderer/src/lib/design-options.ts`

`outcomeTypes` is the list in the Outcome Type step. Add yours with `enabled: true`, and an icon from `lucide-react` (browse them at lucide.dev). Also remove `'Count'` from `upcomingOutcomeTypes`, which lists planned types that aren't real yet.

```ts
  { value: 'count', label: 'Count', icon: Hash, enabled: true },
```

**Help text** (the panel beside each step), in `src/renderer/src/components/simulation/`:

- `outcome-type-help.tsx`: a block describing count outcomes, with examples, like the existing binary and continuous blocks.
- `outcome-parameters-help.tsx`: a branch explaining the count fields.
- `decision-rule-help.tsx`: a sentence on what the margin means for a rate ratio, next to the binary and continuous ones.

Ask the statistician to read the help text: it's what users rely on to fill in the form correctly.

### Step 13. Add the form fields

**New file:** `src/renderer/src/components/simulation/count-outcome-section.tsx`

Copy `continuous-outcome-section.tsx`, which is the simplest one, and change it:

```tsx
export function CountOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Count Outcome Parameters</h3>
      <div className="space-y-6">
        <NumericField form={form} path={['meanCount']} label={FIELD_LABELS.meanCount} />
        <NumericField form={form} path={['rateRatio']} label={FIELD_LABELS.rateRatio} />
      </div>
    </div>
  )
}
```

Then wire it in:

- **`outcome-parameters-section.tsx`:** add `else if (outcomeType.input === 'count') return <CountOutcomeSection form={form} />`.
- **`numeric-field.tsx`:** `NumericFieldPath` lists every field a number box can hold. Add `| ['meanCount']` and `| ['rateRatio']`.
- **`form.tsx`:** the `steps` list says which fields belong to which step, so the step shows a red mark when one of its fields has an error. Add `'meanCount'` and `'rateRatio'` to the **Outcome Parameters** step's `fields`.

### Step 14. Update the decision rule step

The decision rule cards show a formula (such as `P(IRR > 1) > 0.95`) and a chart of the effect. Four files in `src/renderer/src/`:

- **`lib/decision-rule-formula.ts`:** `effectSymbol()` returns `'MD'` for continuous outcomes and the odds ratio symbol otherwise. Return `'IRR'` for count. Add a test to `decision-rule-formula.test.ts`.
- **`components/simulation/decision-rule-card.tsx`:** `value` is the treatment effect the chart centres on. It's read from `treatmentEffect` or `meanDiff`; add a `useField` for `rateRatio` and use it for count outcomes.
- **`components/simulation/decision-rule-chart.tsx`:**
  - `getChartType()` returns the axis name and the "no effect" value for each outcome. Add `case 'count': return { key: 'rateRatio', label: 'Rate Ratio', x: 1 }`.
  - The axis is stopped at 0 for binary outcomes (`type === 'binary' ? Math.max(0, lo) : lo`), because a ratio can't be negative. Do the same for count.
  - The tooltip reads the axis value by outcome type (`payload…oddsRatio` or `…meanDiff`). Add `rateRatio`.
- **`components/simulation/decision-rule-preview.tsx`:** the chart's caption says "Odds ratio" or "Mean difference". Add "Rate ratio".

### Step 15. Show the new fields wherever a design is shown

**File:** `src/renderer/src/lib/design-fields.ts`

This is the one list of "what to show for a design", used by the review step, the dashboard, the results page, the runs table and the Word report. Add your fields to `designFields`:

```ts
  {
    key: 'meanCount',
    label: FIELD_LABELS.meanCount,
    section: 'outcome',
    outcome: 'count',
    value: (input) => (input.outcomeType === 'count' ? input.meanCount : undefined)
  },
  // and the same for rateRatio
```

Also in that file:

- Add `'count'` to the `outcome?: 'binary' | 'continuous'` type on `DesignField`.
- Add `meanCount?` and `rateRatio?` to the `DesignSnapshot` type.
- `decisionRuleSummaries()` returns nothing unless the outcome is binary or continuous. Let count through.

Then fix the other places that only allow the two current outcomes. Search for `!== 'binary' && input.outcomeType !== 'continuous'`; there are three:

- `src/renderer/src/components/common/design-parameters.tsx` (the design on the results page and dashboard)
- `src/renderer/src/lib/report/run-report.ts` (the Word report's design section)
- `src/renderer/src/lib/design-fields.ts` (`decisionRuleSummaries`, above)

And two places that list fields one by one:

- **`src/renderer/src/components/simulation/review-section.tsx`:** the review step reads each field with `useField` and builds a `snapshot`. Add `useField` calls for `meanCount` and `rateRatio`, and put them in the snapshot.
- **`src/renderer/src/components/results/columns.tsx`** (the runs table): `outcomeScopedColumnIds` lists the columns that only apply to some outcomes, and `outcomeScopedField()` works out which outcome each belongs to, assuming there are only two (`binaryField ?? continuousField`). Add your fields to the list and make that function look through every outcome type.

### Step 16. Support the outcome in batch CSV files

**File:** `src/renderer/src/lib/batch-mapper.ts`

- In `buildBatchValidations()`, add a branch next to `if (outcomeType === 'binary')`:

  ```ts
  } else if (outcomeType === 'count') {
    candidate = {
      outcomeType,
      meanCount: cell(row.meanCount),
      rateRatio: cell(row.rateRatio),
      ...common
    }
  }
  ```

- Update the error message for an unknown outcome type: `must be "binary", "continuous" or "count"`.
- Add `'meanCount'` and `'rateRatio'` to `TEMPLATE_HEADERS`, and add an example count row to `TEMPLATE_ROWS`, so the downloadable template shows how to fill one in.

Add tests to `src/renderer/src/lib/batch-mapper.test.ts`: a valid count row, and one with a bad mean count.

### Step 17. Nothing to do: the results

As section 3 said, the results tables, bar chart, sample size tables and the Word report's results sections work for any outcome. Check them in the app, but they shouldn't need changes.

---

## 6. Testing your work

### Automated tests

`npm run check` must pass. Between steps 5 and 16 you should have added tests for:

- the design file keeping the new fields;
- the outcome model;
- the effect direction, including the "no effect" value;
- the main process's check: valid input passes, each bad value gives the right message;
- the R script export;
- the form schema;
- the decision rule formula;
- the batch CSV mapper.

The existing tests for binary and continuous outcomes in each of these files are the best examples to copy.

### By hand, in the app

1. Start the app with `npm run dev`.
2. Create a new design, choose **Count**, and fill in the fields. Try bad values (0, a negative number, text) and check each shows a clear message under the right field.
3. Add a superiority rule and a futility rule. Check the formula reads `P(IRR > 1) > 0.95`, the chart is centred correctly, and its axis doesn't go below 0.
4. Check the review step shows every field with its proper name.
5. Run a small simulation (set the number of simulated trials to about 10 so it's quick). Check the results page, the runs table, **Export report** and **Export R script**.
6. **Run the exported R script in R** and compare its summary with the app's results. They should match, because BATSS sets each simulated trial's seed itself. This is the best check that step 9 (the app's R script) and step 10 (the export) agree.
7. Save the design, close it, reopen it, and check the count values are still there (step 5).
8. Download the batch CSV template, fill in a count row, and run it as a batch.
9. Open a design saved _before_ your change, and check it still opens and runs.

### Checking the statistics

Have the statistician check one run against an independent calculation. For example, with a rate ratio of 1 (no effect), the share of trials stopping for superiority should be close to the type I error the design aims for.

---

## 7. Checklist

Copy this into your pull request and tick each item.

**Shared (`src/shared/`)**

- [ ] `design-rules.ts`: add to `OUTCOME_TYPES`; add `NUMBER_FIELDS`; generalise the ratio margin rule if needed
- [ ] `simulation-types.ts`: new run input type, union, `DesignInput` fields
- [ ] `field-labels.ts`: `FIELD_LABELS` and `SHORT_FIELD_LABELS`
- [ ] `design-file-schema.ts`: new optional fields, plus a test
- [ ] `outcome-model.ts`: family, link, R function, plus a test
- [ ] `effect-direction.ts`: direction rule, plus a test
- [ ] `simulation-input-schema.ts`: new schema in the variant list, plus tests
- [ ] `r-script.ts`: export branch, plus a test

**R (`resources/r/`)**

- [ ] `batss-simulation.R`: `varY` switch, and a `beta` / `varControl` / `to_delta` branch

**Renderer (`src/renderer/src/`)**

- [ ] `lib/schema.ts`: form schema, margin check, defaults, `initialDesignInput`, plus tests
- [ ] `lib/design-options.ts`: enabled in `outcomeTypes`, removed from `upcomingOutcomeTypes`
- [ ] `components/simulation/count-outcome-section.tsx` (new)
- [ ] `components/simulation/outcome-parameters-section.tsx`
- [ ] `components/simulation/numeric-field.tsx`: field paths
- [ ] `components/simulation/form.tsx`: the Outcome Parameters step's fields
- [ ] `components/simulation/outcome-type-help.tsx`, `outcome-parameters-help.tsx`, `decision-rule-help.tsx`
- [ ] `lib/decision-rule-formula.ts`: symbol, plus a test
- [ ] `components/simulation/decision-rule-card.tsx`, `decision-rule-chart.tsx`, `decision-rule-preview.tsx`
- [ ] `lib/design-fields.ts`: fields, types, `decisionRuleSummaries`
- [ ] `components/common/design-parameters.tsx`
- [ ] `lib/report/run-report.ts`
- [ ] `components/simulation/review-section.tsx`
- [ ] `components/results/columns.tsx`
- [ ] `lib/batch-mapper.ts`: rows, error message, template, plus tests

**Finally**

- [ ] `npm run check` passes
- [ ] Every "by hand" check in section 6 done
- [ ] The exported R script gives the same results as the app
- [ ] A statistician has checked the maths and the help text

---

## 8. Common mistakes

- **Forgetting the design file schema (step 5).** Everything works until a design is saved and reopened, and then the new values are gone. valibot's `v.object` quietly drops fields it doesn't know.
- **Changing the app's R script but not the export (steps 9 and 10).** The app gives one answer, the exported script another. Running an exported script (testing step 6) catches this.
- **Forgetting the log for a ratio.** If the effect is a ratio, `beta[2]` and both margins must go through `log()` in R and in the export, and margins must be above 0. Otherwise the results are silently wrong, not an error.
- **Typing a field's name by hand.** Use `FIELD_LABELS` so the form, the tables, the report and the error messages all say the same thing.
- **Only allowing the field in the form.** The main process checks everything again (step 8). If a run is refused with "Only binary and continuous outcomes are supported.", this step is missing.
- **Ignoring compiler errors.** After step 2, TypeScript lists most of the places that need your outcome. Work through them rather than silencing them with `as` or `!`.
- **A "no effect" value that doesn't match.** It appears in the effect direction (step 7), the default margin (step 11) and the decision rule chart (step 14). For a ratio it's 1; for a difference it's 0.

If you get stuck, search for how `continuous` is handled in the same file. It's the simplest existing outcome, and your change will almost always look like it.
