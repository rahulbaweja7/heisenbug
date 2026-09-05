import inspect
from . import test_cinematch

def main():
    passed = failed = errors = 0
    for name, fn in inspect.getmembers(test_cinematch, inspect.isfunction):
        if not name.startswith('test_'):
            continue
        try:
            fn()
            passed += 1
        except AssertionError as exc:
            failed += 1
            print('FAIL', name, exc)
        except Exception as exc:
            errors += 1
            print('ERROR', name, exc)
    print('passed=%d failed=%d errors=%d' % (passed, failed, errors))
    return 1 if failed or errors else 0
if __name__ == '__main__':
    import sys
    sys.exit(main())
