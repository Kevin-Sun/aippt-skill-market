#!/usr/bin/env bash
# batch-clone.sh · 批量浅 clone repo 到 raw-materials/github/
set -o pipefail
GH_DIR="$(cd "$(dirname "$0")/.." && pwd)/raw-materials/github"
mkdir -p "$GH_DIR"
LIST="${1:-/tmp/repos-to-clone.txt}"
PARALLEL="${2:-6}"
ok=0; fail=0; skip=0; faillist=""
while IFS= read -r repo; do
  [ -z "$repo" ] && continue
  dir="${repo//\//__}"
  if [ -d "$GH_DIR/$dir" ]; then
    skip=$((skip+1)); continue
  fi
  (
    if gh repo clone "$repo" "$GH_DIR/$dir" -- --depth 1 --filter=blob:none 2>/tmp/clone-err-$$-$dir.txt; then
      echo "OK $repo"
    else
      echo "FAIL $repo"
    fi
  ) &
  while [ "$(jobs -r | wc -l)" -ge "$PARALLEL" ]; do sleep 0.2; done
done < "$LIST"
wait
