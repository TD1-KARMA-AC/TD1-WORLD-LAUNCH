# Free Gmail Email Setup - Send to td1@td1.world

## ✅ What I've Set Up

1. ✅ **Netlify Function** - `netlify/functions/send-email-notification.js`
2. ✅ **Updated form** - Now sends directly to `td1@td1.world`
3. ✅ **Added nodemailer** - For sending emails via Gmail SMTP

---

## 📋 Setup Steps (Free!)

### Step 1: Create Gmail App Password

1. **Go to your Google Account:**
   - https://myaccount.google.com
   - Sign in with your Gmail account

2. **Enable 2-Step Verification** (if not already enabled):
   - Security → 2-Step Verification
   - Follow setup if needed

3. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords
   - **Select app**: Mail
   - **Select device**: Other (Custom name)
   - Name it: "TD1 World Netlify"
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

**Important:** Remove spaces from the password when using it (just the 16 characters together).

---

### Step 2: Add Environment Variables to Netlify

1. **Go to Netlify Dashboard:**
   - Your site → Site settings → Environment variables

2. **Add First Variable:**
   - Key: `GMAIL_USER`
   - Value: Your Gmail address (e.g., `yourname@gmail.com`)
   - Click "Save"

3. **Add Second Variable:**
   - Key: `GMAIL_APP_PASSWORD`
   - Value: The 16-character app password (no spaces)
   - Click "Save"

---

### Step 3: Deploy

The code is already updated! Just:
1. Wait for Netlify to auto-deploy (or push to GitHub if needed)
2. Test the form on your site

---

## 🎉 How It Works

When someone submits their email on the launch page:

1. ✅ Form submits to Netlify function
2. ✅ Function sends email via Gmail SMTP
3. ✅ Email goes to `td1@td1.world`
4. ✅ User sees success message
5. ✅ Email also stored in localStorage (backup)

---

## 📧 What You'll Receive

You'll get an email like:

```
To: td1@td1.world
From: yourname@gmail.com
Subject: New TD1.WORLD Launch Signup

New email signup for TD1.WORLD launch!

Email: subscriber@example.com
Date: 11/17/2025, 10:30:00 PM
IP: 123.456.789.0
```

---

## ✅ Benefits

- ✅ **FREE** - No monthly cost!
- ✅ **Direct email** - Goes straight to td1@td1.world
- ✅ **Reliable** - Uses Gmail SMTP
- ✅ **Secure** - Uses app password (not your main password)

---

## 🔧 Alternative: If You Don't Have Gmail

If `td1@td1.world` is not Gmail, we can use:
- **SendGrid** (free 100/day)
- **Mailgun** (free 5,000/month)
- **Or configure SMTP for your email provider**

Just let me know!

---

## 📝 Quick Checklist

- [ ] Create Gmail app password
- [ ] Add `GMAIL_USER` to Netlify environment variables
- [ ] Add `GMAIL_APP_PASSWORD` to Netlify environment variables
- [ ] Test the form!

---

**After you add the environment variables, test it and you should receive emails at td1@td1.world!** 🚀

