#!/bin/bash

# Prompt for Git details
read -p "Enter Git repository URL: " GIT_URL
read -p "Enter branch name: " BRANCH_NAME

# Clone the repo
REPO_NAME=$(basename "$GIT_URL" .git)
echo -e "\nCloning $GIT_URL (branch: $BRANCH_NAME)..."
git clone --branch "$BRANCH_NAME" "$GIT_URL" || {
    echo "❌ Error: Failed to clone repository. Check URL/branch and try again."
    exit 1
}

cd "$REPO_NAME" || { echo "❌ Error: Could not enter project directory."; exit 1; }

# Get available projects (non-hidden directories in /home/ubuntu)
echo -e "\nScanning available projects..."
mapfile -t PROJECTS < <(find /home/ubuntu/ -maxdepth 1 -type d ! -name ".*" ! -name "ubuntu" -printf "%f\n" | sort)

# Show interactive project selection menu
if [ ${#PROJECTS[@]} -eq 0 ]; then
    echo "❌ Error: No projects found in /home/ubuntu"
    exit 1
fi

echo -e "\nSelect available project:"
PS3="> Enter your choice (1-${#PROJECTS[@]}): "
select PROJECT in "${PROJECTS[@]}"; do
    if [[ -n "$PROJECT" ]]; then
        SERVER_FILES_PATH="/home/ubuntu/$PROJECT/server_files"
        if [ -d "$SERVER_FILES_PATH" ]; then
            echo -e "\n✔ Selected project: $PROJECT"
            echo "Copying files from $SERVER_FILES_PATH..."
            cp -ra "$SERVER_FILES_PATH"/* . || {
                echo "❌ Error: Failed to copy files from $SERVER_FILES_PATH"
                exit 1
            }
            break
        else
            echo "❌ Error: server_files directory not found in $PROJECT"
            exit 1
        fi
    else
        echo "❌ Invalid selection. Please try again."
    fi
done

# Deploy with Docker
echo -e "\nStarting Docker deployment..."
docker-compose up -d --build || {
    echo "❌ Error: Docker-compose failed"
    exit 1
}

echo -e "\n✅ Success! Project '$PROJECT' deployed successfully from branch '$BRANCH_NAME'"
