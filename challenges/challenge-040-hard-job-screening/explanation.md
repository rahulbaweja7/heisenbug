# Two Bugs, Two Layers

## Bug 1: `any` instead of `all` for required skills

```python
has_skills = any(skill in applicant.skills for skill in posting.required_skills)
```

`any()` passes as soon as the applicant has *one* of the required
skills, but the rule is that they need *every* required skill. An
applicant missing 2 of 3 required skills still gets `has_skills =
True` as long as they have at least one match.

**Fix:**

```python
has_skills = all(skill in applicant.skills for skill in posting.required_skills)
```

## Bug 2: `applicant_count` increments before qualification is known

```python
applicant.already_screened = True
posting.applicant_count += 1

qualified = is_qualified(applicant, posting)
return qualified
```

`applicant_count` is meant to track qualified applicants, but it's
incremented unconditionally, before `is_qualified` even runs. Every
screened applicant inflates the count, rejected or not.

**Fix:** move the increment after the qualification check, and only
do it when `qualified` is `True`.

## How to spot this pattern faster

- `any`/`all` bugs are easy to miss because both read as plausible
  English — check which one matches "must have every X" vs. "must
  have at least one X."
- When a counter increments unconditionally near the top of a
  function but the field name implies it should track a specific
  outcome, check whether the increment needs to move after the
  decision is made.
