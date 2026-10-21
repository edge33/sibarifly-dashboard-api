#!/usr/bin/env bash
set -euo pipefail

: "${IMAGE:?Image repository is required}"
: "${RELEASE_COMMIT:?Release commit is required}"
: "${DEV_TRIGGER_ID:?Development trigger ID is required}"
: "${DEV_BUILD_REGION:?Development build region is required}"
[[ "$RELEASE_COMMIT" =~ ^[a-f0-9]{40}$ ]]
[[ "$DEV_TRIGGER_ID" =~ ^[a-f0-9-]{36}$ ]]

# Release Please can create the tag before the main-branch build finishes.
for attempt in {1..80}; do
  gcloud builds list --region="$DEV_BUILD_REGION" \
    --filter="buildTriggerId=$DEV_TRIGGER_ID AND substitutions.COMMIT_SHA=$RELEASE_COMMIT AND status=SUCCESS" \
    --sort-by='~createTime' --limit=10 --format=json > /workspace/development-builds.json
  image=$(python3 scripts/select-development-image.py /workspace/development-builds.json \
    "$RELEASE_COMMIT" "$DEV_TRIGGER_ID" "$IMAGE")
  if [[ -n "$image" ]]; then
    printf '%s\n' "$image" > /workspace/release-image.txt
    echo "Promoting tested image: $image"
    exit 0
  fi
  echo "Waiting for successful development validation ($attempt/80)"
  sleep 15
done

echo 'No successful development build found for this release; no production changes made.' >&2
exit 1
