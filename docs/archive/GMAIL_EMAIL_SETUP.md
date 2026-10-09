# Gmail Email Setup - Launch Page Form

## Current Status

**Email notifications are disabled** - Netlify charges $20/month for email notifications.

The form still works and collects emails:
- ✅ Submissions saved to Netlify Forms (viewable in dashboard)
- ✅ Stored in browser localStorage (backup)
- ❌ No email notifications sent (to avoid $20/month cost)

**We'll add newsletter functionality later** when ready to send emails.

---

## Option 2: Send to td1@td1.world (Your Domain Email)

If `td1@td1.world` forwards to your Gmail:

1. **Netlify Dashboard:**
   - Site settings → Forms
   - Add notification → Email
   - **Email address**: `td1@td1.world`
   - Save

This way, emails go to `td1@td1.world` and forward to your Gmail.

---

## Option 3: Use EmailJS (Direct to Gmail, More Control)

If you want more control or Netlify Forms doesn't work:

### Setup EmailJS:

1. **Sign up for EmailJS:**
   - Go to https://www.emailjs.com
   - Sign up (free for 200 emails/month)

2. **Connect Gmail:**
   - Go to "Email Services"
   - Click "Add New Service"
   - Choose "Gmail"
   - Connect your Gmail account
   - Note the Service ID (e.g., `service_abc123`)

3. **Create Email Template:**
   - Go to "Email Templates"
   - Click "Create New Template"
   - **Name**: "Launch Notification"
   - **Subject**: "New TD1.WORLD Launch Signup"
   - **Content**: 
     ```
     New email signup for TD1.WORLD launch!
     
     Email: {{email}}
     Date: {{date}}
     ```
   - **To Email**: Your Gmail address
   - Save
   - Note the Template ID (e.g., `template_xyz789`)

4. **Get Public Key:**
   - Go to "Account" → "General"
   - Copy your Public Key (e.g., `user_abc123`)

5. **Update Your Form:**
   - I'll add EmailJS integration to your form
   - Send me: Service ID, Template ID, and Public Key

---

## Recommended: Option 1 (Netlify Forms)

**Easiest and already set up!**

Just:
1. Go to Netlify → Forms
2. Add email notification
3. Enter your Gmail address
4. Done!

You'll receive emails like:
```
Subject: New form submission on www.td1.world
From: Netlify

New submission for form 'launch-notifications'
Fields:
- email: subscriber@example.com
```

---

## Which Do You Prefer?

**Option 1 (Netlify Forms):**
- ✅ Already set up
- ✅ Free (100/month)
- ✅ Just add email notification
- ✅ Emails go to your Gmail

**Option 3 (EmailJS):**
- More control over email format
- Custom subject/body
- Direct to Gmail
- Requires setup

**I recommend Option 1** - it's the quickest! Just add your Gmail in Netlify Forms settings.

---

**Let me know which option you want, or I can set up EmailJS if you prefer more control!** 📧

