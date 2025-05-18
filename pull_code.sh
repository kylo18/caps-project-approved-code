#!/bin/bash

# Run this to get updated code from repo
# make sure to grant appropriate run privilege by running the command below
# chmod u+x pull_code.sh

# Get current directory (where script is run from)
PROJECT_DIR=$(pwd)

# Verify this is a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Error: Not in a Git repository. Run this from your project root."
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "\n🔄 Pulling latest changes for '$CURRENT_BRANCH'..."

# Stash any local changes to avoid conflicts
git stash push --include-untracked --message "Auto-stash by pull script"

# Pull updates
if ! git pull origin "$CURRENT_BRANCH"; then
  echo "❌ Pull failed. Resolve conflicts manually."
  git stash pop  # Restore local changes
  exit 1
fi

# Restore stashed changes if any exist
if git stash list | grep -q "Auto-stash by pull script"; then
  git stash pop
fi

# Docker rebuild prompt
read -rp $'\n🔧 Rebuild Docker containers? This will stop and start the system after rebuild. [y/N] ' REBUILD
if [[ "$REBUILD" =~ ^[Yy]$ ]]; then
  echo -e "\nRebuilding containers..."
  if command -v docker-compose &> /dev/null; then
    docker-compose down
    docker-compose up -d --build
  else
    echo "⚠️ docker-compose not found. Using 'docker compose' instead."
    docker compose down
    docker compose up -d --build
  fi
fi

echo -e "\n✅ Update complete for '$CURRENT_BRANCH'"
