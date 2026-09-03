# Two Bugs, Two Layers

## Bug 1: operator precedence in the eligibility rule

```python
return not has_overdue and not at_limit or book_available
```

`and` binds tighter than `or` in Python, so this actually evaluates as
`(not has_overdue and not at_limit) or book_available`. Since
`book_available` is `True` most of the time (there are 2 copies on the
shelf), the `or` swallows the other two conditions entirely — a patron
who is overdue, or at their 5-book limit, still gets approved as long
as a copy exists.

**Fix:** require all three conditions with parentheses:

```python
return (not has_overdue and not at_limit) and book_available
```

## Bug 2: side effects happen before the eligibility check

```python
book.copies_available -= 1
repository.record_checkout(patron_id, book_id)
patron.books_checked_out += 1

if not is_eligible(patron, book, repository):
    raise CheckoutDeniedError(...)
```

`checkout_service.py` mutates inventory and patron state *before*
checking eligibility. Even when the checkout is correctly denied, the
book's copy count has already been decremented and a checkout record
has already been written — corrupting the repository on every denial.

**Fix:** check eligibility first, and only mutate state after
confirming the checkout is allowed.

## How to spot this pattern faster

- When a rules function combines several boolean conditions with mixed
  `and`/`or`, mentally add parentheses around each `and` group and
  check whether the grouping matches the plain-English rule.
- When a service function fails or denies but still leaves the
  repository looking like the operation succeeded, look for mutations
  that happen before the validation check instead of after it.
