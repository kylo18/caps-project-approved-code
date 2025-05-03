#!/bin/bash

# Auto-detect project name from current directory path
if [[ $(pwd) =~ ^/home/ubuntu/([^/]+) ]]; then
    PROJECT="${BASH_REMATCH[1]}"
    echo -e "ℹ️ Auto-detected project: $PROJECT"
else
    echo "❌ Error: This script must be run from a project directory under /home/ubuntu/"
    exit 1
fi

# Verify server_files directory exists
SERVER_FILES_PATH="/home/ubuntu/$PROJECT/server_files"
if [[ ! -d "$SERVER_FILES_PATH" ]]; then
    echo "❌ Error: server_files directory not found at $SERVER_FILES_PATH"
    exit 1
fi

# Git operations
if [[ -d ".git" ]]; then
    # Existing repository - pull updates
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "\n🔄 Found existing repository. Pulling updates for branch '$CURRENT_BRANCH'..."
    git pull origin "$CURRENT_BRANCH" || {
        echo "❌ Error: Git pull failed"
        exit 1
    }
else
    # New clone - get repository details
    read -rp "Enter Git repository URL: " GIT_URL
    read -rp "Enter branch name: " BRANCH_NAME
    
    echo -e "\n🌐 Cloning $GIT_URL (branch: $BRANCH_NAME)..."
    git clone --branch "$BRANCH_NAME" "$GIT_URL" . || {
        echo "❌ Error: Failed to clone repository"
        exit 1
    }
fi

# Copy server files
echo -e "\n📂 Copying configuration files from $SERVER_FILES_PATH..."
cp -rav "$SERVER_FILES_PATH"/* . || {
    echo "❌ Error: Failed to copy files"
    exit 1
}

# Docker deployment
read -rp $'\n🐳 Deploy with Docker? [Y/n] ' DEPLOY
if [[ "$DEPLOY" =~ ^[Nn]$ ]]; then
    echo -e "\n✅ Setup completed without Docker deployment"
else
    echo -e "\n🚀 Starting Docker deployment..."
    
    # Check for available compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        echo "❌ Error: No Docker compose command available"
        exit 1
    fi
    
    $COMPOSE_CMD up -d --build || {
        echo "❌ Error: Docker deployment failed"
        exit 1
    }
    
    echo -e "\n✅ Success! Project '$PROJECT' deployed successfully"
fi