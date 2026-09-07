"""Trusted bridge, invoked with isolated Python outside the candidate import path."""
import os, sys, json, hashlib, base64, stat

ROOT = '/workspace'
MAX_FILE = 100000
MAX_TOTAL = 1000000

def snapshot():
    files = {}
    total = 0
    rootfd = os.open(ROOT, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    def visit(fd, prefix='', depth=0):
        nonlocal total
        if depth > 12:
            return
        for name in sorted(os.listdir(fd)):
            if name.startswith('.') or name in ('__pycache__', 'node_modules', 'tests'):
                continue
            relative = prefix + name
            if len(relative) > 240 or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./-' for c in relative):
                continue
            try:
                child = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
            except OSError:
                continue
            try:
                info = os.fstat(child)
                if stat.S_ISDIR(info.st_mode):
                    visit(child, relative + '/', depth + 1)
                elif stat.S_ISREG(info.st_mode) and info.st_size <= MAX_FILE:
                    raw = os.read(child, MAX_FILE + 1)
                    if len(raw) > MAX_FILE or b'\0' in raw:
                        continue
                    try:
                        text = raw.decode('utf-8')
                    except UnicodeDecodeError:
                        continue
                    total += len(raw)
                    if total > MAX_TOTAL or len(files) >= 200:
                        raise ValueError('Workspace exceeds 200 text files or 1 MB')
                    files[relative] = text
            finally:
                os.close(child)
    try:
        visit(rootfd)
    finally:
        os.close(rootfd)
    revision = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
    return {'files': files, 'revision': revision}

def write_file(name, content):
    parts = name.split('/')
    fd = os.open(ROOT, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in parts[:-1]:
            try:
                os.mkdir(part, dir_fd=fd)
            except FileExistsError:
                pass
            nextfd = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = nextfd
        if content is None:
            try:
                os.unlink(parts[-1], dir_fd=fd)
            except FileNotFoundError:
                pass
        else:
            # Replace, never truncate an existing hard link or follow a symlink.
            temp = '.save-' + os.urandom(12).hex()
            out = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644, dir_fd=fd)
            try:
                with os.fdopen(out, 'wb') as stream:
                    stream.write(content.encode())
                os.replace(temp, parts[-1], src_dir_fd=fd, dst_dir_fd=fd)
            finally:
                try:
                    os.unlink(temp, dir_fd=fd)
                except FileNotFoundError:
                    pass
    finally:
        os.close(fd)

payload = json.loads(base64.b64decode(sys.argv[1]))
current = snapshot()
if 'files' in payload:
    if payload.get('revision') != current['revision']:
        print(json.dumps({'conflict': True, **current}))
        sys.exit(0)
    for name in current['files'].keys() - payload['files'].keys():
        write_file(name, None)
    for name, text in payload['files'].items():
        if current['files'].get(name) != text:
            write_file(name, text)
    current = snapshot()
print(json.dumps(current))
