# Two Bugs, Two Layers

## Bug 1: strict `<` excludes claims exactly at the limit

```python
within_limit = claim.amount < policy.coverage_limit
```

A claim for exactly `5000` on a policy with a `5000` coverage limit
should be approved — "within the limit" includes the boundary. Using
`<` instead of `<=` rejects any claim that lands exactly on the limit.

**Fix:**

```python
within_limit = claim.amount <= policy.coverage_limit
```

## Bug 2: `claims_filed_count` increments before validity is known

```python
repository.claims.append(claim)
policy.claims_filed_count += 1

if not is_claim_valid(policy, claim):
    raise ClaimDeniedError(...)
```

The claim is recorded and the count bumped *before* checking whether
it's actually valid. A denied claim still ends up counted and stored
as if it had been filed successfully.

**Fix:** check validity first, and only append the claim / increment
the count once it's confirmed valid.

## How to spot this pattern faster

- Any comparison against a "limit" or "cap" should almost always be
  `<=`, not `<` — check whether the boundary value itself should pass
  or fail.
- Same signature as other challenges in this set: mutations that
  represent "this happened" (recording a claim, bumping a counter)
  belong after the validation check, not before.
