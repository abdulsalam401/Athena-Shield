#!/bin/bash

# Simple Release Script for Athena Shield
# Usage: ./release.sh v1.0.0 "Initial Release"

VERSION=$1
MSG=$2

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version> <message>"
  exit 1
fi

echo "🚀 Preparing Release $VERSION..."

# 1. Update Version File (Optional, if we had one)
# echo $VERSION > backend/VERSION

# 2. Git Tag
git tag -a "$VERSION" -m "$MSG"

# 3. Push
git push origin "$VERSION"

echo "✅ Release $VERSION Pushed to GitHub!"
echo "🔗 Check https://github.com/abdulsalam401/Athena-Shield/releases"
