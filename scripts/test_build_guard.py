import os
import shutil
import textwrap
from pathlib import Path
import subprocess
import tempfile
import unittest


GUARD = Path(__file__).with_name('check-build-current.sh').resolve()


class BuildGuardTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.workspace = Path(self.directory.name)
        shutil.copytree(GUARD.parent, self.workspace / 'scripts', ignore=shutil.ignore_patterns('__pycache__'))
        mock = self.workspace / 'gcloud'
        mock.write_text('''#!/usr/bin/env bash
set -eu
printf '%s\\n' "$*" >> calls
case "$1 $2" in
  'builds describe')
    [[ "${FAIL_DESCRIBE:-0}" != 1 ]] || exit 1
    printf '%s\\n' "${METADATA-trigger-1	2026-10-23T10:00:00Z}"
    ;;
  'builds list')
    [[ "${FAIL_LIST:-0}" != 1 ]] || exit 1
    printf '%s' "${NEWER_BUILD:-}"
    ;;
  'container images') printf 'sha256:%064d\\n' 0 ;;
  'run deploy') exit 0 ;;
  *) exit 99 ;;
esac
''')
        mock.chmod(0o755)
        self.env = {
            **os.environ,
            'PATH': f'{self.workspace}:{os.environ["PATH"]}',
            'PROJECT_ID': 'test-project',
            'BUILD_ID': 'current-build',
            'LOCATION': 'europe-west1',
            'IMAGE': 'gcr.io/test/image:revision',
            'SERVICE': 'test-service',
            'REGION': 'europe-west8',
        }

    def run_guard(self, **env):
        return subprocess.run(
            ['bash', str(GUARD)], cwd=self.workspace,
            env={**self.env, **env}, capture_output=True, text=True
        )

    def test_current_build_can_continue(self):
        result = self.run_guard()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse((self.workspace / '.skip-deployment').exists())
        calls = (self.workspace / 'calls').read_text()
        self.assertIn('--project=test-project --region=europe-west1', calls)
        self.assertIn('trigger_id="trigger-1"', calls)
        self.assertIn('create_time>"2026-10-23T10:00:00Z"', calls)
        self.assertNotIn('status=', calls)

    def test_superseded_build_skips_successfully_and_stays_skipped(self):
        result = self.run_guard(NEWER_BUILD='new-build')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('new-build', result.stdout)
        self.assertTrue((self.workspace / '.skip-deployment').exists())
        calls = (self.workspace / 'calls').read_text()
        result = self.run_guard(FAIL_DESCRIBE='1')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.workspace / 'calls').read_text(), calls)

    def test_new_build_during_migrations_is_detected_on_recheck(self):
        self.assertEqual(self.run_guard().returncode, 0)
        result = self.run_guard(NEWER_BUILD='arrived-during-migration')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.workspace / '.skip-deployment').exists())

    def test_history_errors_block_deployment(self):
        for failure in ['FAIL_DESCRIBE', 'FAIL_LIST']:
            with self.subTest(failure=failure):
                self.assertNotEqual(self.run_guard(**{failure: '1'}).returncode, 0)

    def test_missing_trigger_or_creation_time_blocks_deployment(self):
        for metadata in ['', '2026-10-23T10:00:00Z', 'trigger-1']:
            with self.subTest(metadata=metadata):
                self.assertNotEqual(self.run_guard(METADATA=metadata).returncode, 0)

    def test_missing_environment_blocks_deployment(self):
        for name in ['PROJECT_ID', 'BUILD_ID', 'LOCATION']:
            with self.subTest(name=name):
                self.assertNotEqual(self.run_guard(**{name: ''}).returncode, 0)

    def pipeline_script(self, filename, step):
        # Extract the inline shell block so these tests exercise the deployed commands.
        config = GUARD.parent.parent.joinpath(filename).read_text()
        section = config.split(f'  - id: {step}\n', 1)[1].split('\n  - id:', 1)[0]
        lines = section.split('      - |\n', 1)[1].splitlines()
        script = []
        for line in lines:
            if line and not line.startswith('        '):
                break
            script.append(line)
        return textwrap.dedent('\n'.join(script)).replace('$$', '$')

    def test_pipeline_deploys_only_current_builds(self):
        for config in ['cloudbuild.yaml', 'cloudbuild.production.yaml']:
            for newer in ['', 'newer-build']:
                with self.subTest(config=config, newer=newer):
                    (self.workspace / '.skip-deployment').unlink(missing_ok=True)
                    (self.workspace / 'calls').unlink(missing_ok=True)
                    result = subprocess.run(
                        ['bash', '-ec', self.pipeline_script(config, 'deploy')],
                        cwd=self.workspace, env={**self.env, 'NEWER_BUILD': newer},
                        capture_output=True, text=True
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    calls = (self.workspace / 'calls').read_text()
                    self.assertEqual('run deploy' in calls, not bool(newer))

    def test_superseded_pipeline_skips_migrations_and_deploy(self):
        (self.workspace / '.skip-deployment').touch()
        for config in ['cloudbuild.yaml', 'cloudbuild.production.yaml']:
            for step in ['migrate', 'deploy']:
                with self.subTest(config=config, step=step):
                    result = subprocess.run(
                        ['sh' if step == 'migrate' else 'bash', '-ec',
                         self.pipeline_script(config, step)],
                        cwd=self.workspace, env=self.env,
                        capture_output=True, text=True
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertFalse((self.workspace / 'calls').exists())


if __name__ == '__main__':
    unittest.main()
