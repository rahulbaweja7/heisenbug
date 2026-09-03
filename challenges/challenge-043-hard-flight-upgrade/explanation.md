# Two Bugs, Two Layers

## Bug 1: no-show check is inverted

```python
no_show_ok = passenger.no_show_count > 0
```

This is backwards — a passenger is supposed to be "ok" when they have
**zero** no-shows, but `> 0` flags exactly the opposite: passengers
*with* no-show history read as `no_show_ok = True`, while clean-record
passengers (`no_show_count == 0`) read as `False` and get denied.

**Fix:**

```python
no_show_ok = passenger.no_show_count == 0
```

## Bug 2: seat inventory changes before eligibility is known

```python
flight.upgrade_seats_available -= 1
passenger.upgrades_used += 1

if not is_upgrade_eligible(passenger, flight):
    raise UpgradeDeniedError(...)
```

The seat count is decremented and `upgrades_used` incremented before
checking eligibility. A denied request still consumes a seat and
counts as a used upgrade.

**Fix:** check eligibility first, and only mutate `flight` and
`passenger` state once the upgrade is confirmed approved.

## How to spot this pattern faster

- A boolean named `..._ok` or `..._valid` should read naturally as
  "the good case is True" — if the comparison direction requires you
  to mentally flip it, it's worth double-checking against the actual
  business rule.
- Same signature as other challenges in this set: inventory or usage
  counters should only change after the decision that justifies the
  change, not before.
