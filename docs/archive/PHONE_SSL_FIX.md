# Phone SSL Issue - Additional Troubleshooting

## The Problem
Site loads on PC but shows "can't provide secure connection" on phone.

## Most Common Causes

### 1. **Certificate Not Provisioned for www Subdomain**
Netlify needs to issue a certificate specifically for `www.td1.world`.

**Fix:**
1. Netlify Dashboard → Your Site → Domain settings
2. Click on `www.td1.world`
3. HTTPS tab → Click "Provision certificate"
4. Wait 5-60 minutes

### 2. **DNS Not Fully Propagated**
Your phone's DNS might not have updated yet.

**Fix:**
- Check: https://www.whatsmydns.net/#CNAME/www.td1.world
- Clear phone DNS cache:
  - **Android**: Settings → Network → Private DNS → Off, then back On
  - **iPhone**: Settings → General → Reset → Reset Network Settings

### 3. **Phone Date/Time Wrong**
SSL certificates check system time. Wrong date = certificate error.

**Fix:**
- Check phone's date/time settings
- Make sure it's set automatically

### 4. **Using HTTP Instead of HTTPS**
Make sure you're typing `https://` not `http://`

**Fix:**
- Always use: `https://www.td1.world`
- The redirects I added should help, but try directly with https://

### 5. **Phone Browser Cache**
Old cached version might be causing issues.

**Fix:**
- Clear browser cache completely
- Try incognito/private mode
- Try different browser (Chrome, Safari, Firefox)

### 6. **Network Issue**
Some networks (corporate WiFi, public WiFi) block certain SSL certificates.

**Fix:**
- Try switching from WiFi to mobile data (or vice versa)
- Try different network

---

## Step-by-Step Diagnostic

1. **Check Netlify SSL Status:**
   - Go to Netlify → Site → Domain settings → `www.td1.world` → HTTPS tab
   - What does it say? "Active", "Provisioning", or "Error"?

2. **Test on Phone:**
   - Try: `https://www.td1.world` (with https://)
   - Try: Your Netlify URL (e.g., `https://td1-world-launch.netlify.app`)
   - Does the Netlify URL work? If yes, it's a DNS/certificate issue.

3. **Check DNS:**
   - Visit: https://www.whatsmydns.net/#CNAME/www.td1.world
   - Is it pointing to your Netlify site?

4. **Check Certificate:**
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter: `www.td1.world`
   - What grade does it get?

---

## Quick Test

Try accessing your site using the Netlify URL on your phone:
- `https://your-site-name.netlify.app`

If that works, the issue is with the custom domain setup.
If that doesn't work, the issue is with Netlify deployment itself.

---

## What I Just Fixed

I updated `netlify.toml` to:
- Remove Next.js configuration (you have static HTML)
- Set correct publish directory (`.` instead of `.next`)
- Keep HTTPS redirects
- This should fix the build configuration mismatch

**Next step:** Push this fix and wait for Netlify to rebuild.

---

## Still Not Working?

1. **Check Netlify Build Logs:**
   - Netlify Dashboard → Deploys → Latest deploy → Build log
   - Any errors?

2. **Verify Domain in Netlify:**
   - Domain settings → Make sure `www.td1.world` is listed
   - Check if it shows "SSL certificate active"

3. **Try Different Device:**
   - Test on another phone/tablet
   - If same issue, it's server-side
   - If works, it's device-specific

Let me know what you see in the Netlify HTTPS settings!

