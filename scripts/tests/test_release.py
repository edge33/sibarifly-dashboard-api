import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("selector", SCRIPTS / "select-development-image.py")
selector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(selector)

COMMIT = "a" * 40
TRIGGER = "12345678-1234-1234-1234-123456789abc"
IMAGE = "gcr.io/project/app"
DIGEST = "sha256:" + "b" * 64


class PromotionTests(unittest.TestCase):
    def setUp(self):
        self.build = {
            "id": "build-id",
            "status": "SUCCESS",
            "buildTriggerId": TRIGGER,
            "substitutions": {"COMMIT_SHA": COMMIT, "BRANCH_NAME": "main"},
            "results": {"images": [{
                "name": f"{IMAGE}:{COMMIT}-build-id",
                "digest": DIGEST,
            }]},
        }

    def select(self, builds):
        return selector.select_image(builds, COMMIT, TRIGGER, IMAGE)

    def test_returns_recorded_digest_from_successful_build(self):
        self.assertEqual(self.select([self.build]), f"{IMAGE}@{DIGEST}")

    def test_waits_when_build_has_not_finished(self):
        self.assertEqual(self.select([]), "")
        for state in ("QUEUED", "WORKING", "FAILURE", "CANCELLED", "TIMEOUT"):
            self.build["status"] = state
            self.assertEqual(self.select([self.build]), "")

    def test_rejects_other_commits_branches_and_triggers(self):
        for field, value in (("COMMIT_SHA", "c" * 40), ("BRANCH_NAME", "other")):
            build = copy.deepcopy(self.build)
            build["substitutions"][field] = value
            self.assertEqual(self.select([build]), "")
        self.build["buildTriggerId"] = "other-trigger"
        self.assertEqual(self.select([self.build]), "")

    def test_rejects_missing_or_unrelated_artifacts(self):
        self.build["results"]["images"][0]["name"] = f"{IMAGE}:main"
        with self.assertRaises(ValueError):
            self.select([self.build])
        self.build["results"] = {}
        with self.assertRaises(ValueError):
            self.select([self.build])

    def test_rejects_invalid_digest(self):
        self.build["results"]["images"][0]["digest"] = "latest"
        with self.assertRaises(ValueError):
            self.select([self.build])

    def test_requires_commit_and_trigger(self):
        for commit, trigger in (("main", TRIGGER), (COMMIT, "")):
            with self.assertRaises(ValueError):
                selector.select_image([], commit, trigger, IMAGE)

    def test_release_tag_must_match_package_version(self):
        version = json.loads((SCRIPTS.parent / "package.json").read_text())["version"]
        for tag, succeeds in ((f"v{version}", True), (f"v{version}.0", False),
                              (f"v{version}-beta.1", False), ("v01.0.0", False), ("", False)):
            result = subprocess.run(
                ["node", str(SCRIPTS / "verify-release.mjs")],
                env={**os.environ, "RELEASE_TAG": tag}, capture_output=True,
            )
            self.assertEqual(result.returncode == 0, succeeds, tag)


if __name__ == "__main__":
    unittest.main()
