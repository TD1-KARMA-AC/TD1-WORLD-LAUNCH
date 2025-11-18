// Netlify Serverless Function to send email notifications
// Sends directly to td1@td1.world using Gmail SMTP

const nodemailer = require('nodemailer');

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

    // Create transporter using Gmail SMTP
    // Environment variables needed:
    // GMAIL_USER: Your Gmail address
    // GMAIL_APP_PASSWORD: Gmail app-specific password
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'td1@td1.world',
      subject: 'New TD1.WORLD Launch Signup',
      text: `New email signup for TD1.WORLD launch!\n\nEmail: ${email}\nDate: ${new Date().toLocaleString()}\nIP: ${event.headers['x-forwarded-for'] || 'N/A'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C1A2FF;">New TD1.WORLD Launch Signup</h2>
          <p>A new email has been submitted on the launch page.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>IP:</strong> ${event.headers['x-forwarded-for'] || 'N/A'}</p>
          </div>
          <p style="color: #666; font-size: 12px;">TD1.WORLD Launch Page - www.td1.world</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email sent successfully',
        email: email 
      })
    };

  } catch (error) {
    console.error('Email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        message: error.message 
      })
    };
  }
};

