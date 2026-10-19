# 🚀 Deploy to Netlify - Step by Step

Your code is successfully pushed to GitHub! Now let's deploy it to Netlify.

## ✅ Step 1: Go to Netlify

Open: **https://www.netlify.com**

## ✅ Step 2: Sign In

1. Click **"Sign up"** or **"Log in"**
2. Choose **"Sign in with GitHub"** (easiest option)
3. Authorize Netlify to access your GitHub account

## ✅ Step 3: Create New Site

1. Click the **"Add new site"** button
2. Select **"Import an existing project"**

## ✅ Step 4: Connect to GitHub

1. Choose **"Deploy with GitHub"**
2. If prompted, authorize Netlify (it might ask for repository access)
3. Select the repository: **`TD1-WORLD-LAUNCH`**

## ✅ Step 5: Configure Build Settings

Netlify will show build settings. Configure as follows:

- **Build command**: Leave **EMPTY** (just delete any default text)
- **Publish directory**: Type **`.`** (just a single dot)

**Important**: These are the correct settings for a static HTML site.

## ✅ Step 6: Deploy!

1. Click **"Deploy site"**
2. Wait 30-60 seconds...
3. **Your site will be live!** 🎉

You'll get a URL like: `https://amazing-site-12345.netlify.app`

## ✅ Step 7: Add Custom Domain (www.td1.world)

Once deployed:

1. Go to your site dashboard in Netlify
2. Click **"Site settings"** (or gear icon)
3. Click **"Domain management"** in the left sidebar
4. Click **"Add custom domain"**
5. Enter: **`www.td1.world`**
6. Click **"Verify"** or **"Add domain"**

### Configure DNS

Netlify will show you DNS configuration. You have two options:

**Option A: Use Netlify DNS (Recommended)**
1. Netlify will provide nameservers (like `dns1.p01.nsone.net`)
2. Go to your domain registrar (where you bought www.td1.world)
3. Find DNS/Nameserver settings
4. Change nameservers to the ones Netlify provided
5. Wait 24-48 hours for DNS propagation

**Option B: Keep Current DNS Provider**
1. Netlify will show you a DNS record to add
2. Go to your domain registrar's DNS settings
3. Add a **CNAME** record:
   - **Name/Host**: `www` or `www.td1.world`
   - **Value/Target**: Your Netlify site URL (e.g., `td1-world-launch.netlify.app`)
4. Wait 5-60 minutes for DNS to propagate

**HTTPS is automatic!** Netlify will automatically provision an SSL certificate for `https://www.td1.world`

---

## 🎉 Done!

Your launch page will be live at: **https://www.td1.world**

The countdown timer will automatically show time until **November 22, 2025 at 11:22 AM**

---

## 📝 Quick Links

- **Your GitHub Repo**: https://github.com/TD1-KARMA-AC/TD1-WORLD-LAUNCH
- **Netlify Dashboard**: https://app.netlify.com
- **Your Site**: (will be shown after deployment)

---

## 💡 Updating Your Site Later

To update your site after making changes:

```powershell
cd C:\TD1WORLD
git add .
git commit -m "Update launch page"
git push
```

Netlify will **automatically rebuild and redeploy** when you push to GitHub! ✨

