import nodemailer from 'nodemailer';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let cachedTransporter = null;
let cachedConfigSummary = null;
let cachedEtherealAccount = null;

const logEmailConfig = () => {
  if (!cachedConfigSummary) return;
};

// Brevo API email sending
const sendEmailViaBrevoAPI = async (to, subject, html) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error('BREVO_API_KEY not configured');
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@crm.com',
          name: 'CRM System'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error) {
    console.error('❌ Brevo API error:', error.response?.data || error.message);
    throw error;
  }
};

const createTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // Prefer real SMTP credentials when provided
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const service = process.env.EMAIL_SERVICE;
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
    const secure = process.env.EMAIL_SECURE === 'true';

    const transportConfig = {
      connectionTimeout: process.env.EMAIL_CONNECTION_TIMEOUT ? Number(process.env.EMAIL_CONNECTION_TIMEOUT) : 30000,
      greetingTimeout: process.env.EMAIL_GREETING_TIMEOUT ? Number(process.env.EMAIL_GREETING_TIMEOUT) : 30000,
      socketTimeout: process.env.EMAIL_SOCKET_TIMEOUT ? Number(process.env.EMAIL_SOCKET_TIMEOUT) : 60000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };

    if (host) {
      transportConfig.host = host;
      transportConfig.port = port || 587;
      transportConfig.secure = secure;
      console.log(`📧 Email service configured with SMTP host: ${host}:${port || 587} (secure: ${secure})`);
    } else {
      transportConfig.service = service || 'gmail';
      console.log(`📧 Email service configured with service: ${service || 'gmail'}`);
    }

    console.log(`📧 Email user: ${process.env.EMAIL_USER}`);
    console.log(`📧 Timeouts: connection=${transportConfig.connectionTimeout}ms, greeting=${transportConfig.greetingTimeout}ms, socket=${transportConfig.socketTimeout}ms`);

    cachedTransporter = nodemailer.createTransport(transportConfig);
    cachedConfigSummary = {
      provider: transportConfig.service || transportConfig.host || 'custom',
      user: process.env.EMAIL_USER
    };
    
    // Verify the connection
    try {
      await cachedTransporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError.message);
      console.error('   This may cause email sending to fail. Please check your EMAIL credentials.');
    }
    
    logEmailConfig();
    return cachedTransporter;
  }

  // Fall back to Ethereal (auto-generate account when not supplied)
  console.warn('⚠️  No EMAIL_USER or EMAIL_PASS found - falling back to Ethereal test account');
  
  if (!cachedEtherealAccount) {
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
      cachedEtherealAccount = {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS
      };
      cachedConfigSummary = { provider: 'ethereal:env', user: cachedEtherealAccount.user };
    } else {
      cachedEtherealAccount = await nodemailer.createTestAccount();
      cachedConfigSummary = { provider: 'ethereal:auto', user: cachedEtherealAccount.user };
      console.log('⚠️  No SMTP credentials supplied – generated temporary Ethereal account.');
      console.log(`   Username: ${cachedEtherealAccount.user}`);
      console.log(`   Password: ${cachedEtherealAccount.pass}`);
    }
  }

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: cachedEtherealAccount
  });

  logEmailConfig();
  return cachedTransporter;
};

export const getEmailConfigSummary = () => cachedConfigSummary;

// Generate OTP (6-digit numeric code)
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email templates - FIXED: Properly handle template data
const emailTemplates = {
  taskReminder: (templateData) => {
    const { agentName, clientName, taskTitle, taskDescription, dueDate, isOverdue, appUrl } = templateData;

    const formattedDate = new Date(dueDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const headerColor  = isOverdue ? '#dc2626' : '#f97316';
    const badgeColor   = isOverdue ? '#fef2f2' : '#fff7ed';
    const badgeBorder  = isOverdue ? '#fca5a5' : '#fed7aa';
    const badgeText    = isOverdue ? '#dc2626' : '#ea580c';
    const statusLabel  = isOverdue ? '⚠️ OVERDUE' : '⏰ DUE SOON';
    const subject      = isOverdue
      ? `Overdue Task: "${taskTitle}" for ${clientName}`
      : `Reminder: Task "${taskTitle}" is due soon for ${clientName}`;

    return {
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb; }
            .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .header { background: ${headerColor}; color: white; padding: 28px 32px; }
            .header h1 { margin: 0 0 4px; font-size: 20px; }
            .header p  { margin: 0; font-size: 13px; opacity: 0.9; }
            .body { padding: 28px 32px; }
            .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${badgeColor}; border: 1px solid ${badgeBorder}; color: ${badgeText}; margin-bottom: 20px; }
            .task-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${headerColor}; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .task-card h3 { margin: 0 0 8px; font-size: 16px; color: #1e293b; }
            .task-card p  { margin: 4px 0; font-size: 14px; color: #64748b; }
            .task-card .due { font-weight: bold; color: ${badgeText}; }
            .cta { text-align: center; margin: 28px 0 8px; }
            .cta a { background: ${headerColor}; color: white; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; }
            .footer { text-align: center; padding: 18px 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>📋 Task Reminder</h1>
              <p>CRM System — Automated Notification</p>
            </div>
            <div class="body">
              <div class="badge">${statusLabel}</div>
              <p>Hi <strong>${agentName}</strong>,</p>
              <p>You have a task ${isOverdue ? 'that is <strong>overdue</strong>' : 'coming up <strong>soon</strong>'} for client <strong>${clientName}</strong>.</p>

              <div class="task-card">
                <h3>${taskTitle}</h3>
                ${taskDescription ? `<p>${taskDescription}</p>` : ''}
                <p class="due">📅 Due: ${formattedDate}</p>
                <p>👤 Client: ${clientName}</p>
              </div>

              ${isOverdue
                ? '<p style="color:#dc2626;font-weight:bold;">This task is past its due date. Please action it as soon as possible.</p>'
                : '<p>Please make sure to complete this task on time to keep your client relationship on track.</p>'
              }

              ${appUrl ? `
              <div class="cta">
                <a href="${appUrl}/agent/clients">View Client</a>
              </div>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated reminder from your CRM System. Do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  meetingInvite: (templateData) => {
    const { clientName, agentName, title, date, duration, location, mode, agenda, meetingLink } = templateData;

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const getModeIcon = (mode) => {
      switch (mode) {
        case 'zoom': return '📹';
        case 'google-meet': return '🎥';
        case 'teams': return '👥';
        case 'phone': return '📞';
        case 'in-person': return '🏢';
        default: return '📅';
      }
    };

    return {
      subject: `Meeting Invitation: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .meeting-details { background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 4px solid #FF6B35; margin: 25px 0; }
            .meeting-info { margin: 15px 0; }
            .meeting-info strong { display: inline-block; width: 120px; }
            .join-button {
              background: #FF6B35;
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              display: inline-block;
              margin: 20px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .agenda { background: #fff8e1; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Meeting Invitation</h1>
              <p>${getModeIcon(mode)} ${title}</p>
            </div>

            <div class="content">
              <h2>Hello ${clientName},</h2>
              <p>You have been invited to a meeting by ${agentName}. Please find the details below:</p>

              <div class="meeting-details">
                <h3>📋 Meeting Details:</h3>
                <div class="meeting-info"><strong>Title:</strong> ${title}</div>
                <div class="meeting-info"><strong>Date & Time:</strong> ${formatDate(date)}</div>
                <div class="meeting-info"><strong>Duration:</strong> ${duration} minutes</div>
                <div class="meeting-info"><strong>Location/Mode:</strong> ${location}</div>
                <div class="meeting-info"><strong>Meeting Type:</strong> ${mode.replace('-', ' ').toUpperCase()}</div>
                ${meetingLink ? `<div class="meeting-info"><strong>Meeting Link:</strong> <a href="${meetingLink}" target="_blank">${meetingLink}</a></div>` : ''}
              </div>

              ${agenda ? `
              <div class="agenda">
                <h4>📝 Agenda:</h4>
                <p>${agenda}</p>
              </div>
              ` : ''}

              ${meetingLink ? `
              <div style="text-align: center;">
                <a href="${meetingLink}" class="join-button" target="_blank">🔗 Join Meeting</a>
              </div>
              ` : ''}

              <div style="background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p><strong>💡 Important:</strong> Please arrive 5 minutes early. If you need to reschedule, please contact ${agentName} directly.</p>
              </div>

              <div class="footer">
                <p>This meeting invitation was sent by the CRM System.</p>
                <p>Please add this event to your calendar to avoid missing it.</p>
                <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  clientEmail: (templateData) => {
    const { clientName, agentName, subject, message } = templateData;

    return {
      subject: subject || 'Message from your CRM Agent',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .message-box { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #FF6B35; margin: 25px 0; white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Message from ${agentName}</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${clientName},</h2>
              
              <div class="message-box">
                ${message}
              </div>

              <div class="footer">
                <p>This email was sent by ${agentName} via CRM System.</p>
                <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  passwordReset: (templateData) => {
    const { name, otp } = templateData;

    return {
      subject: `Password Reset Request - CRM System`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #cc2b2b, #ff5252); color: white; padding: 30px; text-align: center; } /* Red for urgency/security */
            .content { padding: 30px; }
            .otp-code { 
              font-family: 'Courier New', monospace; 
              font-size: 32px; 
              font-weight: bold; 
              color: #cc2b2b; 
              text-align: center; 
              letter-spacing: 8px;
              margin: 20px 0;
              padding: 15px;
              background: #fff;
              border: 2px dashed #cc2b2b;
              border-radius: 8px;
            }
            .warning { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset the password for your CRM account.</p>
              <p>Use the following One-Time Password (OTP) to reset your password:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p style="text-align: center;"><em>This code is valid for <strong>15 minutes</strong>.</em></p>

              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              </div>

              <div class="footer">
                <p>This is an automated security message from your CRM System.</p>
                <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  agentWelcome: (templateData) => {
    const { name, email, otp } = templateData;

    return {
      subject: `Welcome to CRM System, ${name}! - Your Login Credentials`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .welcome-text { font-size: 18px; margin-bottom: 20px; }
            .credentials { background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 4px solid #FF6B35; margin: 25px 0; }
            .otp-code { 
              font-family: 'Courier New', monospace; 
              font-size: 32px; 
              font-weight: bold; 
              color: #FF6B35; 
              text-align: center; 
              letter-spacing: 8px;
              margin: 20px 0;
              padding: 15px;
              background: #fff;
              border: 2px dashed #FF6B35;
              border-radius: 8px;
            }
            .login-info { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .steps { background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { margin: 10px 0; padding-left: 15px; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .button { 
              background: #FF6B35; 
              color: white; 
              padding: 15px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block; 
              margin: 20px 0; 
              font-size: 16px;
              font-weight: bold;
            }
            .info-box { background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 CRM Pro System</h1>
              <p>Your Sales Performance Platform</p>
            </div>
            
            <div class="content">
              <h2>Welcome aboard, ${name}! 👋</h2>
              <p class="welcome-text">Your account has been successfully created in our CRM system. We're excited to have you on the team!</p>
              
              <div class="credentials">
                <h3>🔐 Your Login Credentials:</h3>
                <div class="login-info">
                  <p><strong>📧 Email:</strong> ${email}</p>
                  <p><strong>🔑 One-Time Password (OTP):</strong></p>
                  <div class="otp-code">${otp}</div>
                  <p><em>This OTP expires in 24 hours</em></p>
                </div>
              </div>

              <div class="steps">
                <h3>🚀 Getting Started:</h3>
                <div class="step">1. Go to the login page: <a href="https://crm-dbs.vercel.app/login">https://crm-dbs.vercel.app/login</a></div>
                <div class="step">2. Enter your email: <strong>${email}</strong></div>
                <div class="step">3. Use the OTP above as your password</div>
                <div class="step">4. You'll be prompted to create a new secure password</div>
                <div class="step">5. Start exploring your dashboard!</div>
              </div>

              <div class="info-box">
                <p><strong>💡 Security Tip:</strong> For security reasons, please change your password immediately after first login and don't share your credentials with anyone.</p>
              </div>

              <div style="text-align: center;">
                <a href="https://crm-dbs.vercel.app/login" class="button">🎯 Login to Your Dashboard</a>
              </div>

              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>If you didn't request this account, please contact your administrator immediately.</p>
                <p>© ${new Date().getFullYear()} CRM Pro System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};

// Send email function - FIXED: Proper template calling with enhanced error handling
export const sendEmail = async (to, templateName, templateData) => {
  try {
    console.log(`📧 Attempting to send email to ${to} using template '${templateName}'`);
    
    const template = emailTemplates[templateName];

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Call the template function with the data
    const emailContent = template(templateData);

    // Check if Brevo API is available
    if (process.env.BREVO_API_KEY) {
      console.log('📤 Sending via Brevo API');
      const result = await sendEmailViaBrevoAPI(to, emailContent.subject, emailContent.html);
      console.log(`✅ Email sent successfully via Brevo API to ${to} (Message ID: ${result.messageId})`);
      return result;
    }

    // Fallback to SMTP
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'florencenamukisa08@gmail.com',
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    console.log(`📤 Sending email from ${mailOptions.from} to ${to}`);
    console.log(`📋 Subject: ${emailContent.subject}`);

    const result = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(result);
    if (previewUrl) {
      console.log(`✅ Email sent successfully! Preview: ${previewUrl}`);
    } else {
      console.log(`✅ Email sent successfully to ${to} (Message ID: ${result.messageId})`);
    }

    return { success: true, messageId: result.messageId, previewUrl };
  } catch (error) {
    console.error('❌ Email sending error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response?.data || error.response,
      responseCode: error.responseCode,
      to,
      templateName
    });
    return { success: false, error: error.message, details: error };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

// Send email with attachment
export const sendEmailWithAttachment = async (to, subject, htmlContent, attachments = []) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'florencenamukisa08@gmail.com',
      to,
      subject,
      html: htmlContent || '<p>Please find the attached report.</p>',
      attachments
    };

    const result = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(result);
    if (previewUrl) {
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ sendEmailWithAttachment error:', error);
    return { success: false, error: error.message };
  }
};
