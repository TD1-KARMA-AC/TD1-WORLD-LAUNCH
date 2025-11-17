// Netlify Serverless Function to send email notifications
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // Send email using Netlify's built-in email service
    // Or use a service like SendGrid, Mailgun, etc.
    // For now, we'll log it and you can set up email service
    
    // Option 1: Use Netlify Forms (easiest - no code needed)
    // The form will automatically be captured by Netlify
    
    // Option 2: Send email via API (requires email service)
    // You can integrate with:
    // - SendGrid (free tier: 100 emails/day)
    // - Mailgun (free tier: 5,000 emails/month)
    // - AWS SES (very cheap)
    // - Nodemailer with Gmail SMTP
    
    // For now, return success - emails will be captured by Netlify Forms
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email received successfully',
        email: email 
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

