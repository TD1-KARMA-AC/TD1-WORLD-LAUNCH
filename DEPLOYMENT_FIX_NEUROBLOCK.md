# Neuroblock Deployment Fix

## Issue
The website works locally but navigation fails on the live site. The problem is case-sensitivity mismatch between local (Windows) and deployed (Linux) environments.

## Root Cause
- Local: Both `neuroblock/` and `Neuroblock/` folders exist (Windows is case-insensitive)
- Deployed: Only one folder exists (Linux is case-sensitive)
- Netlify redirects `/neuroblock` but the deployed folder might be `Neuroblock/` (capital N)

## Solution Applied

### 1. Updated netlify.toml
- Changed redirects to use lowercase `neuroblock/` folder
- Added case-insensitive redirects (capital N → lowercase)
- Ensures both URL cases work

### 2. Updated Navigation
- Navigation already uses absolute paths `/neuroblock`
- Detection handles both cases

### 3. Standardized on Lowercase
- Web standard: use lowercase folder names
- Netlify now redirects to `/neuroblock/` (lowercase)

## Deployment Steps

1. **Verify folder structure**: Ensure `neuroblock/` (lowercase) folder exists in root
2. **Commit changes**: 
   ```bash
   git add netlify.toml js/unified-navigation.js
   git commit -m "Fix neuroblock routing and case sensitivity"
   git push
   ```
3. **Netlify will auto-deploy** - wait for build to complete
4. **Test**: Visit `https://www.td1.world/neuroblock`

## If Issues Persist

If the deployed site still doesn't work:
1. Check Netlify build logs for errors
2. Verify the `neuroblock/` folder is in the deployed files
3. Check Netlify file browser to see actual folder structure
4. Clear Netlify cache and redeploy

## Folder Structure (Should Be)
```
TD1WORLD/
├── index.html
├── js/
│   └── unified-navigation.js
├── neuroblock/          ← lowercase (web standard)
│   ├── index.html
│   ├── explore.html
│   └── ...
└── netlify.toml
```

