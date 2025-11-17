# Website Launch Plan - TD1.WORLD

## Current Situation

✅ **Launch Page**: `C:\TD1WORLD\index.html` (countdown timer)  
✅ **Main Website**: `C:\TD1.WORLD\website\` (full site)  
✅ **Pages Ready**: index.html, PRODUCTS_INDEX.html, ABOUT.html  

## Plan

### Phase 1: Connect Launch Page to Main Website ✅

1. **Update countdown timer** - When timer hits 0, redirect to main website
2. **Copy website files** - Move from `C:\TD1.WORLD\website\` to GitHub repo
3. **Set up navigation** - Make sure pages link to each other

### Phase 2: Deploy to www.td1.world

1. **File structure:**
   ```
   TD1WORLD/
   ├── index.html (launch page - countdown)
   ├── website/
   │   ├── index.html (main homepage - after launch)
   │   ├── PRODUCTS_INDEX.html
   │   ├── ABOUT.html
   │   └── demos/
   └── ...
   ```

2. **Redirect logic:**
   - Before launch: Show countdown at root (`/`)
   - After launch: Redirect root to `/website/index.html` or rename

### Phase 3: Add Buy Now & Download Links (Later)

1. Add "Buy Now" buttons to product pages
2. Set up download links for products
3. Connect to payment/download system

---

## Implementation Steps

### Step 1: Update Launch Page Countdown ✅
- When timer finishes → Redirect to main website

### Step 2: Copy Website Files
- Copy from `C:\TD1.WORLD\website\` to repo
- Organize file structure

### Step 3: Set Up Navigation
- Add navigation menu to all pages
- Link between pages

### Step 4: Test & Deploy
- Test locally
- Push to GitHub
- Netlify auto-deploys

---

## File Structure After Setup

```
TD1WORLD/
├── index.html (Launch page - countdown)
├── script.js (Countdown + redirect logic)
├── styles.css
├── website/
│   ├── index.html (Main homepage)
│   ├── PRODUCTS_INDEX.html
│   ├── ABOUT.html
│   ├── assets/
│   └── demos/
└── netlify.toml
```

---

## Next Steps

1. ✅ Update countdown to redirect when finished
2. Copy website files to repo
3. Set up navigation
4. Test everything
5. Deploy!

