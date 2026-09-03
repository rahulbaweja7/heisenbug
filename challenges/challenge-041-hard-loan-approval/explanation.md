# Two Bugs, Two Layers

## Bug 1: debt-to-income ratio is computed backwards

```python
debt_to_income = applicant.annual_income / applicant.existing_debt
```

The variable is named `debt_to_income`, but the calculation divides
income by debt — the operands are swapped. A financially healthy
applicant with low debt relative to income ends up with a *huge*
"ratio" (e.g. `60000 / 15000 = 4.0`), which fails the `<= 0.4` check
and gets wrongly denied.

**Fix:**

```python
debt_to_income = applicant.existing_debt / applicant.annual_income
```

## Bug 2: `active_loans_count` increments before the approval decision

```python
applicant.active_loans_count += 1

approved = is_approved(applicant)
application.status = "approved" if approved else "denied"
return approved
```

The count is bumped unconditionally, before `is_approved` even runs.
Every applicant who applies gets their active-loan count incremented,
even ones who are denied.

**Fix:** move the increment after the decision, and only apply it
when `approved` is `True`.

## How to spot this pattern faster

- When a variable's name describes a ratio ("X to Y"), check that the
  numerator and denominator in the code actually match that order —
  swapped operands read fine at a glance but invert the result.
- Same ordering smell as other challenges in this set: a counter or
  status field that's supposed to reflect an outcome should be
  mutated *after* the decision is made, not before.
