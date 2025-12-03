# NeuroBlock Marketplace — Static HTML Version

This is a standalone, deployable version of the NeuroBlock Marketplace. All files are static HTML/CSS/JS and can be deployed to any web server without a backend.

## 📁 File Structure

```
neuroblock/
├── index.html          # Main landing page
├── explore.html        # Browse NeuroBlocks
├── submit.html         # Submit new NeuroBlock
├── product.html        # Individual product page
├── account.html        # User account dashboard
├── admin.html          # Admin review dashboard
├── success.html        # Purchase success page
├── terms.html          # Terms & Conditions
├── privacy.html        # Privacy Policy
├── styles.css          # All styles
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🚀 Deployment

### Option 1: Static Hosting (Recommended)

**Netlify:**
1. Zip the `neuroblock` folder
2. Go to [Netlify](https://netlify.com)
3. Drag and drop the zip file
4. Done! Your site is live

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the `neuroblock` folder
3. Run: `vercel`
4. Follow the prompts

**GitHub Pages:**
1. Create a GitHub repository
2. Upload all files from `neuroblock` folder
3. Go to Settings → Pages
4. Select main branch and `/` root
5. Your site will be at `username.github.io/repo-name`

### Option 2: Traditional Web Server

Upload all files to your web server's public directory (e.g., `/var/www/html/` or `public_html/`).

### Option 3: Local Testing

Simply open `index.html` in your browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🎨 Features

- ✅ Fully responsive design
- ✅ Modern UI with animations
- ✅ Search and filter functionality
- ✅ Category browsing
- ✅ Submit form with drag & drop
- ✅ Mode selector (Sell/Contribute)
- ✅ All pages included
- ✅ No backend required

## 📝 Notes

- This is a **static demo version**. For full functionality (upload, purchase, etc.), you'll need to integrate with the backend API.
- All JavaScript is vanilla JS (no frameworks required)
- CSS uses modern features (works in all modern browsers)
- Fonts are loaded from Fontshare CDN

## 🔧 Customization

- **Colors**: Edit the CSS variables in `styles.css` (search for `#C1A2FF` for the main color)
- **Content**: Edit the HTML files directly
- **Functionality**: Modify `script.js` to add features

## 📄 License

Part of TD1.WORLD — All rights reserved.

