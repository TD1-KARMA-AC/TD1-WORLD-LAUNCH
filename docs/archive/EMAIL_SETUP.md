# Email Setup Guide - Launch Notifications

## Current Status

The email form on the launch page collects email addresses. Submissions are stored in:
- ✅ **Netlify Dashboard** → Forms (view all submissions)
- ✅ **Browser localStorage** (as backup)

**Note:** Email notifications are disabled (would cost $20/month on Netlify). We'll add newsletter functionality later when ready.

## How It Works

When someone enters their email in the "Be the first to know when we launch" section:
1. Form submission is saved to Netlify Forms
2. Also stored in browser localStorage as backup
3. User sees success message
4. You can view all submissions in Netlify Dashboard → Forms

**No email notifications are sent** - we'll add that later with a newsletter service.

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

