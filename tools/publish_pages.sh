#!/usr/bin/env bash
# Publish site/ to the gh-pages branch, which GitHub Pages serves.
# (Used instead of a GitHub Actions workflow.)
set -euo pipefail
cd "$(dirname "$0")/.."
git subtree split --prefix site -b gh-pages >/dev/null
git push origin gh-pages
echo "Published: https://husseinbenz.github.io/tarteel/"
