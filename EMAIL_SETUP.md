# Email Setup Guide - Launch Notifications

## How It Works

When someone enters their email in the "Be the first to know when we launch" section, it will be sent to **td1@td1.world**.

## Setup Options

### Option 1: Netlify Forms (Easiest - Already Configured! ✅)

**What I've Done:**
- Added Netlify Forms attributes to your form
- Form submissions will automatically be captured by Netlify
- You'll receive emails at the address you configure

**How to Set Up Email Notifications:**

1. **Go to Netlify Dashboard:**
   - Your site → Site settings → Forms

2. **Configure Email Notifications:**
   - Click "Add notification"
   - Choose "Email notifications"
   - Enter: `td1@td1.world`
   - Save

3. **That's it!** 
   - All form submissions will be emailed to `td1@td1.world`
   - You'll also see them in Netlify Dashboard → Forms

**Benefits:**
- ✅ Free (up to 100 submissions/month on free tier)
- ✅ No code changes needed
- ✅ Automatic spam protection
- ✅ All submissions stored in Netlify dashboard

---

### Option 2: Custom Email Service (More Control)

If you want more control or higher limits, you can use:

**A. SendGrid (Recommended)**
- Free tier: 100 emails/day
- Easy to set up
- Good deliverability

**B. Mailgun**
- Free tier: 5,000 emails/month
- Great for developers

**C. AWS SES**
- Very cheap ($0.10 per 1,000 emails)
- Requires AWS account

**D. Gmail SMTP**
- Free
- Limited to 500 emails/day
- Requires app password

---

## Current Implementation

The form is now set up to:
1. ✅ Submit to Netlify Forms (automatic)
2. ✅ Store in browser localStorage (backup)
3. ✅ Show success/error messages
4. ✅ Validate email format

---

## Testing

1. **Test the form:**
   - Visit your site
   - Enter an email
   - Submit
   - Check Netlify Dashboard → Forms for the submission

2. **Set up email notifications:**
   - Netlify → Site settings → Forms
   - Add email notification to `td1@td1.world`

---

## Viewing Submissions

**In Netlify Dashboard:**
- Go to: Site → Forms → "launch-notifications"
- See all submissions
- Export as CSV if needed

**In Email:**
- Once configured, you'll receive an email for each submission
- Email will include: email address, timestamp, IP address

---

## Next Steps

1. **Deploy the changes** (already done - just pushed to GitHub)
2. **Wait for Netlify to rebuild** (2-5 minutes)
3. **Configure email notifications:**
   - Netlify Dashboard → Site settings → Forms
   - Add notification → Email → `td1@td1.world`
4. **Test the form** on your live site

---

## Troubleshooting

**Form not submitting?**
- Check browser console for errors
- Verify Netlify Forms is enabled (should be automatic)
- Check Netlify build logs

**Not receiving emails?**
- Check spam folder
- Verify email address in Netlify settings
- Check Netlify Forms dashboard for submissions

**Need more than 100 submissions/month?**
- Upgrade Netlify plan, or
- Set up custom email service (SendGrid, Mailgun, etc.)

---

## Code Changes Made

1. ✅ Added Netlify Forms attributes to HTML form
2. ✅ Updated JavaScript to submit to Netlify Forms
3. ✅ Added error handling and loading states
4. ✅ Kept localStorage as backup

Everything is ready! Just configure the email notification in Netlify Dashboard.

