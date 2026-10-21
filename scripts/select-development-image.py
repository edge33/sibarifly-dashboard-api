"""Resolve an image only from a successful, trusted development build."""

import json
import re
import sys


def select_image(builds, commit, trigger_id, image):
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("A full release commit SHA is required")
    if not trigger_id:
        raise ValueError("The development trigger ID is required")
    for build in builds:
        if (build.get("status") != "SUCCESS"
                or build.get("buildTriggerId") != trigger_id
                or build.get("substitutions", {}).get("COMMIT_SHA") != commit
                or build.get("substitutions", {}).get("BRANCH_NAME") != "main"):
            continue
        expected_name = f"{image}:{commit}-{build['id']}"
        for artifact in build.get("results", {}).get("images", []):
            if artifact.get("name") != expected_name:
                continue
            digest = artifact.get("digest", "")
            if not re.fullmatch(r"sha256:[a-f0-9]{64}", digest):
                raise ValueError("Development build has an invalid image digest")
            return f"{image}@{digest}"
        raise ValueError("Successful development build has no matching image artifact")
    return ""


if __name__ == "__main__":
    with open(sys.argv[1], encoding="utf-8") as source:
        builds = json.load(source)
    print(select_image(builds, *sys.argv[2:]))
