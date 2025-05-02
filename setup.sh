#!/bin/bash

# Run this during first time clone of the repo
# make sure to grant appropriate run privilege by running the command below
# chmod u+x setup.sh

# Prompt user for Git URL
read -p "Enter the Git repository URL: " GIT_URL

# Prompt user for branch name
read -p "Enter the branch name: " BRANCH_NAME

# Extract repository name from URL (for cd'ing into the cloned folder)
REPO_NAME=$(basename "$GIT_URL" .git)

# Clone the repository (with specified branch)
echo "Cloning $GIT_URL (branch: $BRANCH_NAME)..."
git clone --branch "$BRANCH_NAME" "$GIT_URL" || {
    echo "❌ Failed to clone repository. Check URL/branch and try again."
    exit 1
}

# Change into the cloned directory
cd "$REPO_NAME" || {
    echo "❌ Failed to enter directory: $REPO_NAME"
    exit 1
}

# Copy server files (assuming ~/CAPS/server_files exists)
echo "Copying server files..."
cp -ra ~/CAPS/server_files/* . || {
    echo "❌ Failed to copy server files. Check if source directory exists."
    exit 1
}

# Run docker-compose
echo "Starting Docker containers..."
docker-compose up -d --build || {
    echo "❌ Docker-compose failed. Check for errors above."
    exit 1
}

echo "✅ Setup completed successfully!"