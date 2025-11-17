# SSL/HTTPS Troubleshooting Guide

## Problem: Site loads on PC but shows "can't provide secure connection" on phone

This is usually an SSL/HTTPS certificate issue. Here's how to fix it:

---

## Common Causes & Solutions

### 1. **DNS Not Fully Propagated**
**Symptom**: Site works on PC (cached DNS) but not on phone

**Solution**:
- Wait 24-48 hours for DNS to fully propagate
- Clear DNS cache on your phone:
  - **Android**: Settings → Apps → Chrome → Storage → Clear Cache
  - **iPhone**: Settings → Safari → Clear History and Website Data
- Check DNS propagation: https://www.whatsmydns.net

### 2. **SSL Certificate Not Provisioned**
**Symptom**: Netlify hasn't issued SSL certificate yet

**Solution**:
1. Go to Netlify dashboard
2. Site settings → Domain management
3. Click on `www.td1.world`
4. Go to "HTTPS" tab
5. Click "Verify DNS configuration"
6. Wait for certificate to be provisioned (can take 5-60 minutes)

### 3. **Mixed Content (HTTP/HTTPS)**
**Symptom**: Some resources loading over HTTP instead of HTTPS

**Solution**:
- Make sure all links in your HTML use `https://` or relative paths
- Check browser console for mixed content warnings
- Update any hardcoded `http://` URLs to `https://`

### 4. **Netlify SSL Certificate Issue**
**Symptom**: Certificate exists but phone doesn't trust it

**Solution**:
1. Netlify → Site settings → Domain management
2. Click on your domain
3. HTTPS tab → "Renew certificate" or "Provision certificate"
4. Wait 5-60 minutes for renewal

### 5. **Phone Browser Cache**
**Symptom**: Old cached version without SSL

**Solution**:
- Clear browser cache on phone
- Try incognito/private mode
- Try different browser on phone

---

## Quick Fixes to Try

### Fix 1: Force HTTPS Redirect in Netlify

Add to `netlify.toml`:

```toml
[[redirects]]
  from = "http://www.td1.world/*"
  to = "https://www.td1.world/:splat"
  status = 301
  force = true

[[redirects]]
  from = "http://td1.world/*"
  to = "https://www.td1.world/:splat"
  status = 301
  force = true
```

### Fix 2: Check SSL Certificate Status

1. Visit: https://www.ssllabs.com/ssltest/
2. Enter: `www.td1.world`
3. Check certificate status and grade

### Fix 3: Verify DNS Records

Make sure you have:
- **CNAME**: `www` → `your-site.netlify.app`
- Or **A record** pointing to Netlify IPs

---

## Step-by-Step Fix

1. **Check Netlify Dashboard**:
   - Go to your site on Netlify
   - Domain management → Check if `www.td1.world` shows "SSL certificate active"

2. **Provision SSL**:
   - If not active, click "Provision certificate"
   - Wait 5-60 minutes

3. **Test on Phone**:
   - Use incognito mode
   - Try: `https://www.td1.world` (with https://)
   - Check if it works

4. **Add HTTPS Redirect**:
   - Update `netlify.toml` with redirects (see above)
   - Push to GitHub
   - Netlify will auto-deploy

---

## Still Not Working?

1. **Check what URL you're using**:
   - Make sure you're using `https://www.td1.world` (not `http://`)
   - Try the Netlify URL: `https://your-site.netlify.app`

2. **Check phone's date/time**:
   - SSL certificates check system time
   - Make sure phone's date/time is correct

3. **Try different network**:
   - Switch from WiFi to mobile data (or vice versa)
   - Some networks block certain SSL certificates

4. **Contact Netlify Support**:
   - If certificate won't provision
   - Netlify support is very helpful

---

## Expected Behavior

✅ **Working correctly**:
- Site loads on both PC and phone
- Shows padlock icon in browser
- URL shows `https://www.td1.world`

❌ **Not working**:
- "Not secure" warning
- "Can't provide secure connection" error
- Certificate errors

---

Let me know what you see in the Netlify dashboard and I can help further!

