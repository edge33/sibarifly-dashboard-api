#!/usr/bin/env bash
set -euo pipefail

# Keep this decision across Cloud Build steps, even if a newer build later fails.
if [[ -f .skip-deployment ]]; then
  echo 'Skipping migrations and deployment: this build has been superseded.'
  exit 0
fi

metadata=$(gcloud builds describe "${BUILD_ID:?}" \
  --project="${PROJECT_ID:?}" --region="${LOCATION:?}" \
  --format='value(buildTriggerId,createTime)')
IFS=$'\t' read -r trigger_id created_at <<< "$metadata"
if [[ -z "$trigger_id" || -z "$created_at" ]]; then
  echo 'Cannot verify build freshness: a trigger ID and creation time are required.' >&2
  exit 1
fi

# Include queued, failed and cancelled builds: older builds must never take over.
newer_build=$(gcloud builds list \
  --project="$PROJECT_ID" --region="$LOCATION" \
  --filter="trigger_id=\"$trigger_id\" AND create_time>\"$created_at\"" \
  --limit=1 --format='value(id)')
if [[ -n "$newer_build" ]]; then
  echo "Skipping migrations and deployment: superseded by build $newer_build."
  touch .skip-deployment
fi
