# TD1 World - Fully Automated Deployment
# Run this script to automatically push to GitHub and get deployment links

param(
    [string]$GitHubUsername = "",
    [string]$RepoName = "td1-world-launch"
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TD1 World - Automated Deployment Agent      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Git setup
Write-Host "[1/5] Checking Git configuration..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email

if (-not $gitUser -or -not $gitEmail) {
    Write-Host "   ⚠ Git user not configured" -ForegroundColor Yellow
    Write-Host "   Setting default Git user..." -ForegroundColor Gray
    git config user.name "TD1 World"
    git config user.email "dev@td1.world"
    Write-Host "   ✓ Git configured" -ForegroundColor Green
} else {
    Write-Host "   ✓ Git configured: $gitUser <$gitEmail>" -ForegroundColor Green
}

# Step 2: Check commit status
Write-Host ""
Write-Host "[2/5] Checking commit status..." -ForegroundColor Yellow
$commits = git log --oneline -1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Latest commit: $commits" -ForegroundColor Green
} else {
    Write-Host "   ⚠ No commits found. Creating initial commit..." -ForegroundColor Yellow
    git add index.html styles.css script.js netlify.toml README.md .gitignore vercel.json .htaccess DEPLOYMENT_GUIDE.md
    git commit -m "Initial commit: TD1 World launch page"
    Write-Host "   ✓ Initial commit created" -ForegroundColor Green
}

# Step 3: Check files
Write-Host ""
Write-Host "[3/5] Verifying launch page files..." -ForegroundColor Yellow
$requiredFiles = @("index.html", "styles.css", "script.js", "netlify.toml")
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file (MISSING!)" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "   ❌ Missing required files! Cannot proceed." -ForegroundColor Red
    exit 1
}

# Step 4: Check/Add remote
Write-Host ""
Write-Host "[4/5] Checking GitHub remote..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠ No GitHub remote configured" -ForegroundColor Yellow
    Write-Host ""
    
    if ([string]::IsNullOrWhiteSpace($GitHubUsername)) {
        $GitHubUsername = Read-Host "Enter your GitHub username"
    }
    
    $confirm = Read-Host "Repository name (default: $RepoName)"
    if ($confirm) { $RepoName = $confirm }
    
    Write-Host ""
    Write-Host "   Creating GitHub repository URL..." -ForegroundColor Gray
    $remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
    
    Write-Host ""
    Write-Host "   📋 Next step: Create the repository on GitHub" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "   2. Repository name: $RepoName" -ForegroundColor White
    Write-Host "   3. Make it PUBLIC" -ForegroundColor White
    Write-Host "   4. DO NOT initialize with README" -ForegroundColor White
    Write-Host "   5. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    
    $ready = Read-Host "Have you created the repository? (y/n)"
    if ($ready -ne "y" -and $ready -ne "Y") {
        Write-Host "   Please create the repository first and run this script again." -ForegroundColor Yellow
        exit 0
    }
    
    git remote add origin $remoteUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Remote added: $remoteUrl" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to add remote" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✓ Remote configured: $remoteUrl" -ForegroundColor Green
}

# Step 5: Push to GitHub
Write-Host ""
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Ensure we're on main branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "   Renaming branch to 'main'..." -ForegroundColor Gray
    git branch -M main 2>$null
}

Write-Host "   📤 Pushing code to GitHub..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   ⚠ You'll be prompted for credentials:" -ForegroundColor Yellow
Write-Host "   - Username: Your GitHub username" -ForegroundColor White
Write-Host "   - Password: Use a Personal Access Token (NOT your GitHub password)" -ForegroundColor White
Write-Host ""

$pushSuccess = $false
try {
    git push -u origin main 2>&1 | Out-String | ForEach-Object {
        if ($_ -match "error|failed|fatal") {
            Write-Host $_ -ForegroundColor Red
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        $pushSuccess = $true
    }
} catch {
    Write-Host "   ❌ Push failed: $_" -ForegroundColor Red
}

if ($pushSuccess) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ SUCCESS! Code pushed to GitHub!           ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Repository URL:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$GitHubUsername/$RepoName" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 Next: Deploy to Netlify" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   1. Go to: https://www.netlify.com" -ForegroundColor White
    Write-Host "   2. Sign in (use 'Sign in with GitHub')" -ForegroundColor White
    Write-Host "   3. Click 'Add new site' → 'Import an existing project'" -ForegroundColor White
    Write-Host "   4. Choose 'Deploy with GitHub'" -ForegroundColor White
    Write-Host "   5. Select: $RepoName" -ForegroundColor White
    Write-Host "   6. Build command: (leave empty)" -ForegroundColor White
    Write-Host "   7. Publish directory: ." -ForegroundColor White
    Write-Host "   8. Click 'Deploy site'" -ForegroundColor White
    Write-Host ""
    Write-Host "⏱️  Site will be live in ~30 seconds!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Then add custom domain: td1.world" -ForegroundColor Cyan
    Write-Host "   Netlify → Site settings → Domain management → Add custom domain" -ForegroundColor Gray
    Write-Host ""
    
    # Open GitHub in browser
    $open = Read-Host "Open GitHub repository in browser? (y/n)"
    if ($open -eq "y" -or $open -eq "Y") {
        Start-Process "https://github.com/$GitHubUsername/$RepoName"
    }
} else {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ❌ Push to GitHub failed                      ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure you created the repository on GitHub first" -ForegroundColor White
    Write-Host "   2. Use a Personal Access Token as password:" -ForegroundColor White
    Write-Host "      GitHub → Settings → Developer settings → Personal access tokens" -ForegroundColor Gray
    Write-Host "   3. Check your internet connection" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Manual push commands:" -ForegroundColor Cyan
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
}

