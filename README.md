# TD1 World Launch Page

A beautiful, modern launch page for TD1 World with countdown timer.

## Launch Details

- **Domain**: td1.world
- **Launch Date**: November 22, 2025 at 11:22 AM
- **Countdown Timer**: Automatically displays time remaining until launch

## Features

- ⏱️ Real-time countdown timer
- 📧 Email notification signup (stores in browser localStorage)
- ✨ Animated starry background
- 📱 Fully responsive design
- 🎨 Modern gradient design with glassmorphism effects

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and animations
- `script.js` - Countdown timer and form handling logic

## Deployment

### Option 1: Netlify (Recommended - Free)

1. Push this repository to GitHub
2. Go to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.`
6. Click "Deploy site"
7. Go to Site settings → Domain management → Add custom domain
8. Add `td1.world` and follow DNS configuration instructions

### Option 2: Vercel

1. Push this repository to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click "Import Project"
4. Select your GitHub repository
5. Build settings:
   - Framework Preset: Other
   - Output Directory: `.`
6. Click "Deploy"
7. Go to Project Settings → Domains
8. Add `td1.world` and configure DNS

### Option 3: GitHub Pages

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` / `master`
5. Folder: `/ (root)`
6. Save
7. For custom domain, add `CNAME` file with content: `td1.world`
8. Configure DNS: Add CNAME record pointing to `username.github.io`

### Option 4: Traditional Web Hosting

1. Upload all files (`index.html`, `styles.css`, `script.js`) to your web hosting root directory
2. Point your domain `td1.world` to your hosting server via DNS

## DNS Configuration

To connect `td1.world` to your hosting provider, you'll need to add DNS records:

### For Netlify/Vercel:
- **Type**: CNAME
- **Name**: @ or td1.world
- **Value**: Provided by hosting platform (e.g., `your-site.netlify.app`)

### For GitHub Pages:
- **Type**: CNAME
- **Name**: @ or td1.world  
- **Value**: `username.github.io`

### For Traditional Hosting:
- **Type**: A
- **Name**: @ or td1.world
- **Value**: Your server IP address

## Customization

### Change Launch Date/Time

Edit `script.js` line 2:
```javascript
const launchDate = new Date('2025-11-22T11:22:00').getTime();
```

### Modify Colors

Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --accent-color: #ec4899;
}
```

### Email Notifications

Currently, emails are stored in browser localStorage. To integrate with an email service:

1. Set up an API endpoint (e.g., using Netlify Functions, Vercel Serverless Functions, or your own backend)
2. Update the form submission handler in `script.js` to send a POST request to your endpoint

Example with Fetch API:
```javascript
fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

© 2025 TD1 World. All rights reserved.
