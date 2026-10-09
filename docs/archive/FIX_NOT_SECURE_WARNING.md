# Fix "Not Secure" Warning in Browser

## The Problem
Site loads but shows "Not secure" in the address bar (top left).

## Common Causes

### 1. Mixed Content (Most Common)
- Some resources loading over HTTP instead of HTTPS
- Browser blocks/degrades security for HTTP content on HTTPS pages

### 2. SSL Certificate Not Fully Trusted
- Certificate not fully propagated
- Self-signed certificate (unlikely with Netlify)

### 3. Missing Security Headers
- No security headers set
- Browser shows warning

---

## Quick Fixes

### Fix 1: Check for HTTP Links

Make sure all resources use HTTPS:
- ✅ `https://fonts.googleapis.com`
- ❌ `http://fonts.googleapis.com`

### Fix 2: Add Security Headers (Netlify)

Add to `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Fix 3: Force HTTPS in Netlify

Make sure redirects are working (already in netlify.toml).

### Fix 4: Check Certificate Status

Visit: https://www.ssllabs.com/ssltest/
Enter: `www.td1.world`
Check the grade - should be A or A+

---

## What I'll Do

I'll:
1. ✅ Check for HTTP links in HTML/CSS/JS
2. ✅ Add security headers
3. ✅ Verify all resources use HTTPS
4. ✅ Update netlify.toml

---

**Let me check your files for HTTP links first!** 🔍

