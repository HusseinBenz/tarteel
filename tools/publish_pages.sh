#!/usr/bin/env bash
# Publish site/ to the gh-pages branch, which GitHub Pages serves.
# (Used instead of a GitHub Actions workflow.)
set -euo pipefail
cd "$(dirname "$0")/.."
# Refuse to publish a page whose asset versions don't match the committed files.
python tools/build_site.py --stamp
if ! git diff --quiet -- site/; then
  echo "site/ has uncommitted changes (asset versions were re-stamped). Commit them, then publish." >&2
  exit 1
fi
git subtree split --prefix site -b gh-pages >/dev/null
git push origin gh-pages
echo "Published: https://husseinbenz.github.io/tarteel/"
