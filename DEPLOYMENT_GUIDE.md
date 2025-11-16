# Deployment Guide: TD1 World Launch Page to GitHub & Netlify

Follow these steps to deploy your launch page to td1.world via Netlify.

## Step 1: Push to GitHub

### 1.1 Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `td1-world-launch` (or any name you prefer)
4. Description: "TD1 World Launch Page"
5. Make it **Public** (required for free Netlify deployment)
6. **DO NOT** check "Initialize with README" (we already have files)
7. Click "Create repository"

### 1.2 Push Your Code to GitHub

Run these commands in your terminal (from the TD1WORLD directory):

```bash
# Add all files
git add index.html styles.css script.js netlify.toml README.md .gitignore

# Create initial commit
git commit -m "Initial commit: TD1 World launch page"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/td1-world-launch.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: You'll be prompted for your GitHub username and password/token.

If you haven't set up Git credentials:
- For HTTPS: Use a Personal Access Token (Settings → Developer settings → Personal access tokens)
- Or use GitHub Desktop for easier authentication

## Step 2: Deploy to Netlify

### 2.1 Connect Netlify to GitHub

1. Go to [Netlify.com](https://www.netlify.com)
2. Sign up/Log in (you can use "Sign up with GitHub" for easy connection)
3. Click "Add new site" → "Import an existing project"
4. Choose "Deploy with GitHub"
5. Authorize Netlify to access your GitHub account
6. Select your repository: `td1-world-launch`

### 2.2 Configure Build Settings

Netlify will auto-detect settings, but verify:
- **Build command**: (leave empty - static site)
- **Publish directory**: `.` (current directory)
- Click "Deploy site"

### 2.3 Wait for Deployment

Netlify will automatically:
- Build your site (should be instant for static files)
- Generate a URL like: `https://random-name-12345.netlify.app`
- Your site will be live in 30-60 seconds!

## Step 3: Connect Custom Domain (td1.world)

### 3.1 Add Domain in Netlify

1. Go to your site dashboard in Netlify
2. Click "Site settings" → "Domain management"
3. Click "Add custom domain"
4. Enter: `td1.world`
5. Click "Verify" or "Add domain"

### 3.2 Configure DNS

Netlify will show you DNS configuration. You have two options:

**Option A: Use Netlify DNS (Recommended - Easy)**
1. In Netlify domain settings, click "Configure Netlify DNS"
2. You'll get nameservers (e.g., `dns1.p01.nsone.net`)
3. Go to your domain registrar (where you bought td1.world)
4. Update nameservers to the ones Netlify provided
5. Wait 24-48 hours for DNS propagation

**Option B: Use Your Current DNS Provider**
1. In Netlify domain settings, click "Set up Netlify DNS"
2. You'll see DNS records to add:
   - Type: **A**
   - Name: `@` or `td1.world`
   - Value: Netlify IP (e.g., `75.2.60.5`)
   
   OR

   - Type: **CNAME**
   - Name: `@` or `td1.world`
   - Value: Your Netlify site URL (e.g., `your-site-name.netlify.app`)

3. Add these records in your domain registrar's DNS settings
4. Wait 5-60 minutes for DNS to propagate

### 3.3 Enable HTTPS (Automatic)

Netlify automatically provides free SSL certificates via Let's Encrypt:
1. Go to "Domain settings" → "HTTPS"
2. Click "Verify DNS configuration"
3. Once verified, Netlify will automatically provision SSL
4. Your site will be accessible at `https://td1.world`!

## Step 4: Test Your Site

1. Visit `https://td1.world` (or your Netlify URL while DNS propagates)
2. Verify the countdown timer is working
3. Test the email form
4. Check mobile responsiveness

## Troubleshooting

### DNS Not Working?
- Use [whatsmydns.net](https://www.whatsmydns.net) to check DNS propagation
- Make sure DNS records are correctly added
- Wait up to 48 hours for full propagation

### Site Not Loading?
- Check Netlify deployment logs for errors
- Verify all files are committed to GitHub
- Ensure `index.html` is in the root directory

### Want to Update the Site?
Just push changes to GitHub:
```bash
git add .
git commit -m "Update launch page"
git push
```
Netlify will automatically rebuild and redeploy!

## Quick Reference

**GitHub Repository**: `https://github.com/YOUR_USERNAME/td1-world-launch`

**Netlify Dashboard**: `https://app.netlify.com`

**Your Site**: `https://td1.world`

## Need Help?

- Netlify Docs: https://docs.netlify.com
- GitHub Docs: https://docs.github.com
- DNS Help: Check your domain registrar's support

---

**Launch Date**: November 22, 2025 at 11:22 AM 🚀

