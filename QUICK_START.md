# 🚀 Quick Start: Deploy to GitHub & Netlify

## 🤖 AUTOMATED OPTION (EASIEST)

**Just run this PowerShell script:**
```powershell
.\AUTO_DEPLOY.ps1
```

The script will:
- ✅ Check all files are ready
- ✅ Guide you through GitHub setup
- ✅ Push code automatically
- ✅ Give you Netlify deployment links

**Or use the simple batch file:**
```cmd
DEPLOY.bat
```

---

## 📋 MANUAL OPTION

Your code is committed and ready! Follow these 4 simple steps:

## ✅ Step 1: Create GitHub Repository

1. Go to: **https://github.com/new**
2. Fill in:
   - **Repository name**: `td1-world-launch`
   - **Description**: `TD1 World Launch Page`
   - Make it **Public** ✓
   - **DO NOT** check "Add a README file"
3. Click **"Create repository"**

## ✅ Step 2: Push to GitHub

Copy and run these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/td1-world-launch.git
git branch -M main
git push -u origin main
```

**When prompted for password**: Use a **Personal Access Token**, not your GitHub password.

**To create a token**:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Name it "Netlify Deploy"
3. Check `repo` permission
4. Generate and copy the token
5. Use this token as your password when pushing

## ✅ Step 3: Deploy to Netlify

1. Go to: **https://www.netlify.com**
2. Sign up/Login (use "Sign in with GitHub" for easy setup)
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **"Deploy with GitHub"**
5. Authorize Netlify (click "Authorize Netlify")
6. Select repository: **`td1-world-launch`**
7. Build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (just a dot)
8. Click **"Deploy site"**

⏱️ Your site will be live in ~30 seconds at a URL like: `https://amazing-site-12345.netlify.app`

## ✅ Step 4: Connect Domain (td1.world)

1. In Netlify dashboard: Click **"Site settings"** → **"Domain management"**
2. Click **"Add custom domain"**
3. Enter: **`td1.world`**
4. Click **"Verify"**

**Now configure DNS** (Netlify will show you which option to use):

### Option A: Use Netlify DNS (Easiest)
1. Netlify will show you nameservers (like `dns1.p01.nsone.net`)
2. Go to your domain registrar (where you bought td1.world)
3. Find DNS settings / Nameserver settings
4. Change nameservers to Netlify's nameservers
5. Wait 24-48 hours for DNS propagation

### Option B: Keep Your Current DNS Provider
1. Netlify will show you a DNS record to add
2. Go to your domain registrar's DNS settings
3. Add a **CNAME** record:
   - **Name**: `@` or `td1.world`
   - **Value**: Your Netlify site URL (e.g., `td1-world-launch.netlify.app`)
4. Wait 5-60 minutes for DNS to propagate

**Netlify will automatically provide free SSL (HTTPS)** - you'll see a certificate being provisioned automatically!

## 🎉 Done!

Your launch page will be live at: **https://td1.world**

The countdown timer will automatically show time until **November 22, 2025 at 11:22 AM**

---

## 📝 Quick Commands Reference

**Update your site later**:
```bash
git add .
git commit -m "Update launch page"
git push
```
Netlify automatically redeploys when you push to GitHub!

---

**Need help?** See `DEPLOYMENT_GUIDE.md` for detailed instructions.

