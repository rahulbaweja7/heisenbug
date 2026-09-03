# Weekend Checker Rejects Capitalized Day Names

## The bug

```python
return day_name in ("saturday", "sunday")
```

This compares `day_name` directly against all-lowercase strings. Python
string comparison is case-sensitive, so `"Saturday" == "saturday"` is
`False` — any capitalized input (which is the normal way to write day
names) fails the check even though it's clearly a weekend day.

## The fix

```python
return day_name.lower() in ("saturday", "sunday")
```

## How to spot this pattern faster

- Any string comparison against a hardcoded literal is worth checking for
  case sensitivity — ask "what capitalization will this actually receive
  in practice?" Day names, month names, and user input almost never
  arrive pre-normalized to lowercase.
- Test with the input capitalized the way it would naturally appear
  (`"Saturday"`, not just `"saturday"`) — a test suite that only uses
  lowercase can't catch a case-sensitivity bug at all.
- `.lower()` (or `.casefold()` for more aggressive normalization) right
  before a comparison is the standard fix — apply it once, right where
  the comparison happens, rather than hoping every caller already
  lowercases their input.
