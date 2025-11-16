@echo off
echo ========================================
echo TD1 World - Quick Deploy Script
echo ========================================
echo.

echo Checking Git status...
git status --short

echo.
echo Files ready to push:
git ls-files

echo.
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Create GitHub repository:
echo    https://github.com/new
echo    Name: td1-world-launch
echo    Public, no README
echo.
echo 2. Add remote (replace YOUR_USERNAME):
echo    git remote add origin https://github.com/YOUR_USERNAME/td1-world-launch.git
echo.
echo 3. Push to GitHub:
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Deploy to Netlify:
echo    https://www.netlify.com
echo    Add site -^> Import from GitHub -^> Select repo -^> Deploy
echo.
echo ========================================
pause

