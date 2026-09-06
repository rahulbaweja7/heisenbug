"""Linux-only tests for the trusted dir-fd file bridge."""
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

BRIDGE = (Path(__file__).resolve().parents[1] / 'src/execution/workspace_files.py').read_text()


@unittest.skipUnless(sys.platform == 'linux', 'Requires Linux dir_fd and O_NOFOLLOW')
class FileBridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'workspace'
        self.root.mkdir()
        self.script = BRIDGE.replace("ROOT = '/workspace'", 'ROOT = ' + repr(str(self.root)))

    def run_bridge(self, payload=None, check=True):
        result = subprocess.run([sys.executable, '-I', '-c', self.script, base64.b64encode(json.dumps(payload or {}).encode()).decode()], capture_output=True, text=True, timeout=5)
        if not check:
            return result
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_revision_and_external_edit_conflict(self):
        original = self.run_bridge()
        saved = self.run_bridge({'files': {'src/a.py': 'print(42)'}, 'revision': original['revision']})
        self.assertEqual(saved['files']['src/a.py'], 'print(42)')
        (self.root / 'src/a.py').write_text('terminal edit')
        conflict = self.run_bridge({'files': {}, 'revision': saved['revision']})
        self.assertTrue(conflict['conflict'])
        self.assertEqual((self.root / 'src/a.py').read_text(), 'terminal edit')

    def test_symlink_parent_cannot_escape(self):
        outside = Path(self.temp.name) / 'outside'
        outside.mkdir()
        (self.root / 'linked').symlink_to(outside, target_is_directory=True)
        snapshot = self.run_bridge()
        result = self.run_bridge({'files': {'linked/secret': 'bad'}, 'revision': snapshot['revision']}, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((outside / 'secret').exists())

    def test_hardlink_is_replaced_without_modifying_target(self):
        outside = Path(self.temp.name) / 'outside'
        outside.write_text('original')
        os.link(outside, self.root / 'linked.py')
        snapshot = self.run_bridge()
        self.run_bridge({'files': {'linked.py': 'new'}, 'revision': snapshot['revision']})
        self.assertEqual(outside.read_text(), 'original')
        self.assertEqual((self.root / 'linked.py').read_text(), 'new')

    def test_snapshot_skips_symlinks_binary_files_and_reserved_directories(self):
        (self.root / 'plain.py').write_text('42')
        (self.root / 'link.py').symlink_to(self.root / 'plain.py')
        (self.root / 'binary').write_bytes(b'\x00\xff')
        (self.root / 'tests').mkdir()
        (self.root / 'tests/hidden.py').write_text('hidden')
        self.assertEqual(self.run_bridge()['files'], {'plain.py': '42'})


if __name__ == '__main__':
    unittest.main(verbosity=2)
