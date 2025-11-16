# TD1 World - Automated Deployment Script
# This script helps automate pushing to GitHub and deploying to Netlify

Write-Host "🚀 TD1 World Launch Page - Automated Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if Git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git not initialized. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📦 Current branch: $currentBranch" -ForegroundColor Yellow

# Show files ready to commit
Write-Host ""
Write-Host "📄 Files ready to push:" -ForegroundColor Green
git ls-files | ForEach-Object { Write-Host "   ✓ $_" -ForegroundColor Gray }

Write-Host ""
$response = Read-Host "Do you want to push to GitHub now? (y/n)"

if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Check if remote exists
$remoteExists = git remote | Select-String -Pattern "origin"
if (-not $remoteExists) {
    Write-Host ""
    Write-Host "🔗 GitHub Repository Setup" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You need to create a GitHub repository first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: td1-world-launch" -ForegroundColor White
    Write-Host "3. Make it Public" -ForegroundColor White
    Write-Host "4. DO NOT initialize with README" -ForegroundColor White
    Write-Host ""
    
    $githubUsername = Read-Host "Enter your GitHub username"
    $repoName = Read-Host "Enter repository name (or press Enter for 'td1-world-launch')"
    
    if ([string]::IsNullOrWhiteSpace($repoName)) {
        $repoName = "td1-world-launch"
    }
    
    Write-Host ""
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$githubUsername/$repoName.git"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add remote. Make sure the repository exists on GitHub." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Remote added successfully!" -ForegroundColor Green
}

# Rename branch to main if needed
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host ""
    Write-Host "Renaming branch to 'main'..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✓ Branch renamed!" -ForegroundColor Green
}

# Push to GitHub
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: You'll be prompted for GitHub credentials." -ForegroundColor Cyan
Write-Host "Use a Personal Access Token (not your password)" -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://www.netlify.com" -ForegroundColor White
    Write-Host "2. Sign up/Login (use 'Sign in with GitHub')" -ForegroundColor White
    Write-Host "3. Click 'Add new site' → 'Import an existing project'" -ForegroundColor White
    Write-Host "4. Choose 'Deploy with GitHub'" -ForegroundColor White
    Write-Host "5. Select your repository: $repoName" -ForegroundColor White
    Write-Host "6. Build command: (leave empty)" -ForegroundColor White
    Write-Host "7. Publish directory: ." -ForegroundColor White
    Write-Host "8. Click 'Deploy site'" -ForegroundColor White
    Write-Host ""
    Write-Host "Your site will be live in ~30 seconds!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Check your credentials and try again." -ForegroundColor Red
    Write-Host ""
    Write-Host "To create a Personal Access Token:" -ForegroundColor Yellow
    Write-Host "1. GitHub → Settings → Developer settings" -ForegroundColor White
    Write-Host "2. Personal access tokens → Tokens (classic)" -ForegroundColor White
    Write-Host "3. Generate new token → Check 'repo' permission" -ForegroundColor White
    Write-Host "4. Use the token as your password" -ForegroundColor White
}

