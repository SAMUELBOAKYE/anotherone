const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Email Service for KAAF University Noticeboard System
 * Handles sending emails with templates and attachments
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */


const TEMPLATES_DIR = path.join(__dirname, '../templates/emails');


if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

/**
 * Create email transporter based on environment
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {

  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'boakyesamuel189@gmail.com',
        pass: process.env.ETHEREAL_PASS || 'sam059SAM@#$'
      }
    });
  }
  

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP configuration missing. Emails will not be sent in production.');
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

/**
 * Generate HTML email template
 * @param {string} template - Template name
 * @param {Object} data - Template data
 * @returns {string} HTML content
 */
const generateEmailTemplate = (template, data = {}) => {
  const baseStyles = `
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background: #f5f5f5; 
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: white; 
      border-radius: 10px; 
      overflow: hidden; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
    }
    .content { 
      padding: 30px; 
      background: white; 
    }
    .button { 
      display: inline-block; 
      padding: 12px 30px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0; 
      font-weight: bold; 
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      font-size: 12px; 
      color: #666; 
      border-top: 1px solid #eee; 
      background: #f9f9f9; 
    }
    .event-details, .notice-details { 
      background: #f8f9fa; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 15px 0; 
    }
    .event-details p, .notice-details p { 
      margin: 5px 0; 
    }
    .alert { 
      background: #fff3cd; 
      border-left: 4px solid #ffc107; 
      padding: 12px; 
      margin: 15px 0; 
    }
    .success { 
      background: #d4edda; 
      border-left: 4px solid #28a745; 
      padding: 12px; 
      margin: 15px 0; 
    }
    .warning { 
      background: #fff3cd; 
      border-left: 4px solid #ffc107; 
      padding: 12px; 
      margin: 15px 0; 
    }
    .danger { 
      background: #f8d7da; 
      border-left: 4px solid #dc3545; 
      padding: 12px; 
      margin: 15px 0; 
    }
  `;

  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title || 'KAAF University'}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.headerTitle || 'KAAF University'}</h1>
        </div>
        <div class="content">
          {{CONTENT}}
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>KAAF University Management Team</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from KAAF University. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} KAAF University. All rights reserved.</p>
          ${data.unsubscribeUrl ? `<p><a href="${data.unsubscribeUrl}" style="color: #666;">Unsubscribe</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  let content = '';

  switch (template) {
    case 'welcome':
      content = `
        <h2>Welcome to KAAF University, ${data.name}! 🎓</h2>
        <p>Your account has been successfully created. You can now access the Digital Campus Noticeboard and Event Management System.</p>
        <div class="success">
          <strong>Account Details:</strong><br>
          Email: ${data.email}<br>
          Role: ${data.role}
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>
        </div>
      `;
      break;

    case 'welcomeVerified':
      content = `
        <h2>Welcome to KAAF University, ${data.name}! 🎓</h2>
        <p>Your ${data.role} account has been successfully verified.</p>
        <div class="success">
          <strong>Your Account Details:</strong><br>
          Role: ${data.role}<br>
          ID: ${data.uniqueId}<br>
          Email: ${data.email}
        </div>
        <div style="text-align: center;">
          <a href="${data.loginUrl || process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>
        </div>
        <p>You now have full access to the Digital Campus Noticeboard and Event Management System.</p>
      `;
      break;

    case 'verification':
      content = `
        <h2>Verify Your ${data.role} Account 📧</h2>
        <p>Hello ${data.name},</p>
        <p>Thank you for registering with KAAF University Noticeboard System.</p>
        <div class="event-details">
          <p><strong>Your Verification Code:</strong> <span style="font-size: 24px; font-weight: bold;">${data.code}</span></p>
          <p><strong>Your ${data.role} ID:</strong> ${data.uniqueId}</p>
        </div>
        <p>Enter this code in the verification page to activate your account. This code expires in 10 minutes.</p>
        <div style="text-align: center;">
          <a href="${data.verificationLink}" class="button">Verify Account</a>
        </div>
        <div class="alert">
          <strong>Didn't request this? Please ignore this email.</strong>
        </div>
      `;
      break;

    case 'passwordReset':
      content = `
        <h2>Password Reset Request 🔐</h2>
        <p>Hello ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center;">
          <a href="${data.resetUrl}" class="button">Reset Password</a>
        </div>
        <div class="alert">
          <strong>⚠️ This link expires in ${data.expiresIn || '1 hour'}.</strong>
        </div>
        <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      `;
      break;

    case 'passwordResetConfirmation':
      content = `
        <h2>Password Reset Successful ✅</h2>
        <p>Hello ${data.name},</p>
        <p>Your password was successfully reset on ${data.date} from IP address: ${data.ip}.</p>
        <div class="success">
          <strong>You can now log in with your new password.</strong>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/login" class="button">Login Now</a>
        </div>
      `;
      break;

    case 'passwordChanged':
      content = `
        <h2>Password Changed Successfully 🔐</h2>
        <p>Hello ${data.name},</p>
        <p>Your password was changed on ${data.date} from IP address: ${data.ip}.</p>
        <div class="alert">
          <strong>If this wasn't you, please contact support immediately.</strong>
        </div>
        <p>If you made this change, no further action is required.</p>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Account</a>
        </div>
      `;
      break;

    case 'newNotice':
      content = `
        <h2>📢 New Notice: ${data.title}</h2>
        <div class="notice-details">
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p>${data.summary || (data.content ? data.content.substring(0, 200) : '')}...</p>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/notices/${data.noticeId}" class="button">View Full Notice</a>
        </div>
      `;
      break;

    case 'noticeUpdate':
      content = `
        <h2>📝 Notice Updated: ${data.title}</h2>
        <div class="notice-details">
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p>${data.summary || (data.content ? data.content.substring(0, 200) : '')}...</p>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/notices/${data.noticeId}" class="button">View Updated Notice</a>
        </div>
      `;
      break;

    case 'newEvent':
      content = `
        <h2>🎉 New Event: ${data.title}</h2>
        <div class="event-details">
          <p><strong>📅 Date:</strong> ${data.eventDate}</p>
          <p><strong>⏰ Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p><strong>📍 Venue:</strong> ${data.venue}</p>
          <p><strong>📝 Description:</strong> ${data.description ? data.description.substring(0, 150) : ''}...</p>
          ${data.capacity ? `<p><strong>👥 Capacity:</strong> ${data.capacity}</p>` : ''}
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/events/${data.eventId}" class="button">View Event & Register</a>
        </div>
      `;
      break;

    case 'eventUpdate':
      content = `
        <h2>🔄 Event Update: ${data.title}</h2>
        <div class="event-details">
          <p><strong>📅 Date:</strong> ${data.eventDate}</p>
          <p><strong>⏰ Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p><strong>📍 Venue:</strong> ${data.venue}</p>
        </div>
        <div class="alert">
          <strong>Please review the updated event details.</strong>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/events/${data.eventId}" class="button">View Updated Event</a>
        </div>
      `;
      break;

    case 'eventRegistration':
      content = `
        <h2>✅ Event Registration Confirmed!</h2>
        <p>Hello ${data.name},</p>
        <p>You have successfully registered for:</p>
        <div class="event-details">
          <p><strong>Event:</strong> ${data.eventTitle}</p>
          <p><strong>📅 Date:</strong> ${data.eventDate}</p>
          <p><strong>⏰ Time:</strong> ${data.startTime}</p>
          <p><strong>📍 Venue:</strong> ${data.venue}</p>
          ${data.ticketNumber ? `<p><strong>🎫 Ticket Number:</strong> ${data.ticketNumber}</p>` : ''}
        </div>
        <div class="success">
          <strong>Please arrive on time and bring your student ID for check-in.</strong>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/events/${data.eventId}" class="button">View Event Details</a>
        </div>
      `;
      break;

    case 'eventReminder':
      content = `
        <h2>⏰ Event Reminder: ${data.eventTitle}</h2>
        <p>Hello ${data.name},</p>
        <p>This is a reminder that the following event is happening ${data.reminderType === 'tomorrow' ? 'tomorrow' : 'soon'}:</p>
        <div class="event-details">
          <p><strong>📅 Date:</strong> ${data.eventDate}</p>
          <p><strong>⏰ Time:</strong> ${data.startTime}</p>
          <p><strong>📍 Venue:</strong> ${data.venue}</p>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/events/${data.eventId}" class="button">View Event Details</a>
        </div>
      `;
      break;

    case 'eventCancellation':
      content = `
        <h2>⚠️ Event Cancelled: ${data.eventTitle}</h2>
        <p>Hello ${data.name},</p>
        <p>We regret to inform you that the following event has been cancelled:</p>
        <div class="event-details">
          <p><strong>📅 Date:</strong> ${data.eventDate}</p>
          <p><strong>⏰ Time:</strong> ${data.startTime}</p>
          <p><strong>📍 Venue:</strong> ${data.venue}</p>
        </div>
        ${data.reason ? `<div class="danger"><strong>Reason:</strong> ${data.reason}</div>` : ''}
        <p>We apologize for any inconvenience caused.</p>
      `;
      break;

    case 'certificateIssued':
      content = `
        <h2>🎓 Certificate Issued!</h2>
        <p>Hello ${data.name},</p>
        <p>Congratulations on completing the event: <strong>${data.eventTitle}</strong>!</p>
        <p>Your certificate is now available for download.</p>
        <div style="text-align: center;">
          <a href="${data.certificateUrl}" class="button">Download Certificate</a>
        </div>
      `;
      break;

    case 'accountVerification':
      content = `
        <h2>Verify Your Email Address 📧</h2>
        <p>Hello ${data.name},</p>
        <p>Please verify your email address to complete your registration:</p>
        <div style="text-align: center;">
          <a href="${data.verificationUrl}" class="button">Verify Email</a>
        </div>
        <div class="alert">
          <strong>This link expires in 24 hours.</strong>
        </div>
      `;
      break;

    default:
      content = `
        <h2>${data.title || 'KAAF University Notice'}</h2>
        <p>${data.content || ''}</p>
      `;
  }

  return baseHtml.replace('{{CONTENT}}', content);
};

/**
 * Send email with options
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Email template name
 * @param {Object} options.data - Template data
 * @param {Array} options.attachments - File attachments
 * @returns {Promise<Object>} Email info
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"KAAF University" <${process.env.EMAIL_FROM || 'noreply@kaaf.edu.gh'}>`,
      to: options.email,
      subject: options.subject,
      html: generateEmailTemplate(options.template, options.data),
      attachments: options.attachments || []
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📧 Email sent to ${options.email}`);
      if (nodemailer.getTestMessageUrl) {
        logger.info(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } else {
      logger.info(`📧 Email sent to ${options.email} - Message ID: ${info.messageId}`);
    }
    
    return info;
  } catch (error) {
    logger.error(`Email sending failed to ${options.email}: ${error.message}`);
    throw error;
  }
};

/**
 * Send bulk emails
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} options - Common email options
 * @returns {Promise<Array>} Results
 */
const sendBulkEmails = async (recipients, options) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        email: recipient.email,
        subject: options.subject,
        template: options.template,
        data: { ...options.data, name: recipient.name, ...recipient.customData }
      });
      results.push({ success: true, email: recipient.email, result });
    } catch (error) {
      results.push({ success: false, email: recipient.email, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  logger.info(`Bulk email sent: ${successCount}/${recipients.length} successful`);
  
  return results;
};

/**
 * Verify email transporter configuration
 * @returns {Promise<boolean>} Verification result
 */
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email transporter verified successfully');
    return true;
  } catch (error) {
    logger.error(`Email transporter verification failed: ${error.message}`);
    return false;
  }
};

/**
 * Send test email
 * @param {string} email - Test email address
 * @returns {Promise<Object>} Email info
 */
const sendTestEmail = async (email) => {
  return sendEmail({
    email,
    subject: 'Test Email - KAAF University',
    template: 'welcome',
    data: {
      name: 'Test User',
      email: email,
      role: 'Test'
    }
  });
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  verifyTransporter,
  sendTestEmail
};