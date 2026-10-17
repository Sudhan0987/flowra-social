#!/bin/sh
# Third-party media we may use but not redistribute are downloaded at render
# time instead of living in this (public) repo.
#   assets/music/mk162.mp3  Mixkit track 162, Mixkit Free License (use in our
#   videos is allowed; redistributing the raw file is not). Same bytes as the
#   copy used since 12 Oct 2026 (sha1 ccffa5fd...).
set -e
cd "$(dirname "$0")/.."
mkdir -p assets/music
if [ ! -s assets/music/mk162.mp3 ]; then
  curl -fsSL -o assets/music/mk162.mp3 https://assets.mixkit.co/music/162/162.mp3
fi
echo "ccffa5fdf2533b206017d0e54bba3c225cc1ee9d  assets/music/mk162.mp3" | shasum -a 1 -c - >/dev/null 2>&1 || { echo "mk162.mp3 does not match the expected file"; exit 1; }
