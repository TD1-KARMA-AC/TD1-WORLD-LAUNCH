# Fix Netlify Domain Configuration

## Current Setup (Wrong ❌)
- **Primary domain**: `td1.world` (without www)
- **www.td1.world**: Redirects to `td1.world`

## Problem
Root domains (`td1.world`) often have SSL certificate issues because they need A records, not CNAME. This causes ERR_SSL_PROTOCOL_ERROR.

## Solution (Fix This ✅)

### Step 1: Set www.td1.world as Primary Domain

1. **In Netlify Dashboard:**
   - Site settings → Domain management
   - Click on `www.td1.world`
   - Click "Set as primary domain"

### Step 2: Make td1.world Redirect to www

1. **Click on `td1.world`** (without www)
2. **Enable "Redirect to primary domain"**
3. **Save**

### Step 3: Result (After Fix ✅)
- **Primary domain**: `www.td1.world` (with www)
- **td1.world**: Redirects to `www.td1.world`

This way:
- ✅ SSL works on `www.td1.world` (CNAME is easier for SSL)
- ✅ `td1.world` redirects to www (avoiding SSL issues)
- ✅ Everyone uses the secure www version

---

## Quick Steps

1. Netlify → Domain management
2. Click on `www.td1.world` → "Set as primary domain"
3. Click on `td1.world` → Enable "Redirect to primary domain"
4. Wait 5-10 minutes for changes to apply
5. Test: `https://www.td1.world` should work!

---

## After This Fix

- `https://www.td1.world` → Works (primary domain with SSL)
- `https://td1.world` → Redirects to `www.td1.world` (no SSL issues)
- `http://td1.world` → Redirects to `https://www.td1.world`
- `http://www.td1.world` → Redirects to `https://www.td1.world`

---

## Why This Works

- **www subdomain** uses CNAME → Easy SSL configuration
- **Root domain** uses A record → More complex SSL
- By making www primary, SSL works reliably
- Root domain just redirects, avoiding SSL issues

---

## Test After Fix

1. Wait 5-10 minutes after making changes
2. Clear browser cache
3. Try: `https://www.td1.world` (should work!)
4. Try: `https://td1.world` (should redirect to www)

---

**This should fix your SSL error!** 🚀

