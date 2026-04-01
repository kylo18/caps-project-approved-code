Write-Host "Staging and committing local frontend work..."
git add .
$commitOutput = git commit -m "Save local frontend work" 2>&1
Write-Host "$commitOutput"

Write-Host "Fetching from origin..."
git fetch origin

Write-Host "Checking out target branch MobileApp/Jdev/TestEnvi..."
git checkout MobileApp/Jdev/TestEnvi
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to checkout MobileApp/Jdev/TestEnvi"
    exit 1
}

# Change directory up one level to run rm and checkout on the folder properly
# Wait, the terminal is already in "Frontend - Deployment", so git rm -r "Frontend - Deployment" would fail because we are inside it.
# We should CD up to the repository root.
cd ..

Write-Host "Removing existing Frontend - Deployment folder from index..."
git rm -rf -q "Frontend - Deployment" 2>&1 | Out-Null

Write-Host "Restoring Frontend - Deployment folder from test branch..."
git checkout test -- "Frontend - Deployment"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to checkout Frontend - Deployment from test"
    exit 1
}

Write-Host "Committing the perfect copy..."
git add "Frontend - Deployment"
$commitOutput2 = git commit -m "feat: replace frontend layout with perfect local copy" 2>&1
Write-Host "$commitOutput2"

Write-Host "Pushing to remote MobileApp/Jdev/TestEnvi..."
git push origin MobileApp/Jdev/TestEnvi
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push to GitHub"
    exit 1
}

Write-Host "Returning to test branch..."
git checkout test

cd "Frontend - Deployment"
Write-Host "Done!"
