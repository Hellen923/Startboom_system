import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let cachedTransporter = null;

const createTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    try {
      await cachedTransporter.verify();
      console.log('✅ Gmail transporter verified');
    } catch (e) {
      console.error('❌ Gmail verification failed:', e.message);
      cachedTransporter = null;
      throw new Error(`Gmail verification failed: ${e.message}`);
    }
    return cachedTransporter;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS in production.');
  }

  console.warn('⚠️ No EMAIL_USER/EMAIL_PASS — falling back to Ethereal');
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  return cachedTransporter;
};



// Generate OTP (6-digit numeric code)
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const emailTemplates = {
  taskReminder: (templateData) => {
    const { agentName, clientName, taskTitle, taskDescription, dueDate, isOverdue, appUrl, companyName = 'HoneyPot CRM' } = templateData;

    const formattedDate = new Date(dueDate).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const headerColor  = isOverdue ? '#dc2626' : '#FFD700';
    const badgeColor   = isOverdue ? '#fef2f2' : '#FFFBEB';
    const badgeBorder  = isOverdue ? '#fca5a5' : '#FFD700';
    const badgeText    = isOverdue ? '#dc2626' : '#B8860B';
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1E293B; margin: 0; padding: 0; background: #F1F5F9; }
            .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
            .header { background: linear-gradient(135deg, ${headerColor} 0%, ${isOverdue ? '#b91c1c' : '#FFC700'} 100%); color: ${isOverdue ? 'white' : '#1E293B'}; padding: 32px; text-align: center; }
            .header img { width: 48px; height: 48px; margin-bottom: 12px; }
            .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; }
            .header p  { margin: 0; font-size: 14px; opacity: 0.9; }
            .body { padding: 32px; }
            .badge { display: inline-block; padding: 8px 16px; border-radius: 24px; font-size: 12px; font-weight: 700; background: ${badgeColor}; border: 2px solid ${badgeBorder}; color: ${badgeText}; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
            .task-card { background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border: 1px solid #E2E8F0; border-left: 4px solid ${headerColor}; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .task-card h3 { margin: 0 0 12px; font-size: 18px; color: #0F172A; font-weight: 700; }
            .task-card p  { margin: 8px 0; font-size: 14px; color: #475569; }
            .task-card .due { font-weight: 700; color: ${badgeText}; font-size: 15px; }
            .cta { text-align: center; margin: 32px 0; }
            .cta a { background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%); color: #1E293B; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3); transition: all 0.3s; }
            .footer { text-align: center; padding: 24px 32px; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; background: #F8FAFC; }
            .footer .brand { font-weight: 700; color: #FFD700; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>📋 Task Reminder</h1>
              <p>${companyName} — Automated Notification</p>
            </div>
            <div class="body">
              <div class="badge">${statusLabel}</div>
              <p>Hi <strong>${agentName}</strong>,</p>
              <p>You have a task ${isOverdue ? 'that is <strong style="color:#dc2626;">overdue</strong>' : 'coming up <strong>soon</strong>'} for client <strong>${clientName}</strong>.</p>

              <div class="task-card">
                <h3>${taskTitle}</h3>
                ${taskDescription ? `<p>${taskDescription}</p>` : ''}
                <p class="due">📅 Due: ${formattedDate}</p>
                <p>👤 Client: ${clientName}</p>
              </div>

              ${isOverdue
                ? '<p style="color:#dc2626;font-weight:700;background:#FEF2F2;padding:12px;border-radius:8px;border-left:4px solid #dc2626;">⚠️ This task is past its due date. Please action it as soon as possible.</p>'
                : '<p style="background:#FFFBEB;padding:12px;border-radius:8px;border-left:4px solid #FFD700;">💡 Please make sure to complete this task on time to keep your client relationship on track.</p>'
              }

              ${appUrl ? `
              <div class="cta">
                <a href="${appUrl}/agent/clients">View Client Details →</a>
              </div>` : ''}
            </div>
            <div class="footer">
              <p><span class="brand">${companyName}</span></p>
              <p>This is an automated reminder. Do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
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
              <p>We received a request to reset the password for your Sales System account.</p>
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
    const { name, email, otp, companyName = 'HoneyPot CRM' } = templateData;
    const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';

    return {
      subject: `Welcome to ${companyName}, ${name}! 🎉 Your Login Credentials`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1E293B; margin: 0; padding: 0; background: #F1F5F9; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%); color: #1E293B; padding: 40px; text-align: center; }
            .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
            .header p { margin: 0; font-size: 15px; opacity: 0.9; font-weight: 600; }
            .logo { width: 64px; height: 64px; margin-bottom: 16px; }
            .content { padding: 40px; }
            .welcome-text { font-size: 18px; margin-bottom: 24px; color: #0F172A; }
            .credentials { background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); padding: 28px; border-radius: 12px; border-left: 4px solid #FFD700; margin: 28px 0; }
            .otp-code { 
              font-family: 'Courier New', monospace; 
              font-size: 36px; 
              font-weight: 900; 
              color: #B8860B; 
              text-align: center; 
              letter-spacing: 10px;
              margin: 24px 0;
              padding: 20px;
              background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
              border: 3px dashed #FFD700;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(255, 215, 0, 0.15);
            }
            .login-info { background: #FFFBEB; padding: 24px; border-radius: 10px; margin: 24px 0; border: 1px solid #FFD700; }
            .login-info strong { color: #B8860B; }
            .steps { background: #F0F9FF; padding: 24px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #3B82F6; }
            .step { margin: 12px 0; padding-left: 16px; font-size: 15px; }
            .step strong { color: #1E40AF; }
            .footer { text-align: center; margin-top: 32px; padding: 24px; color: #64748B; font-size: 13px; border-top: 1px solid #E2E8F0; background: #F8FAFC; }
            .footer .brand { font-weight: 700; color: #FFD700; font-size: 14px; }
            .button { 
              background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%); 
              color: #1E293B; 
              padding: 16px 48px; 
              text-decoration: none; 
              border-radius: 12px; 
              display: inline-block; 
              margin: 24px 0; 
              font-size: 16px;
              font-weight: 700;
              box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
              transition: all 0.3s;
            }
            .info-box { background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .info-box strong { color: #1E40AF; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Welcome to ${companyName}!</h1>
              <p>Sales Management System</p>
            </div>
            
            <div class="content">
              <h2 style="color:#0F172A;font-size:22px;margin:0 0 16px;">Hello ${name}! 👋</h2>
              <p class="welcome-text">Your account has been successfully created. We're excited to have you join our team of high-performing sales professionals!</p>
              
              <div class="credentials">
                <h3 style="color:#0F172A;margin:0 0 16px;font-size:18px;">🔐 Your Login Credentials:</h3>
                <div class="login-info">
                  <p style="margin:8px 0;"><strong>📧 Email Address:</strong><br/>${email}</p>
                  <p style="margin:16px 0 8px;"><strong>🔑 One-Time Password (OTP):</strong></p>
                  <div class="otp-code">${otp}</div>
                  <p style="text-align:center;margin:8px 0;color:#B8860B;font-weight:700;">⏱ Expires in 24 hours</p>
                </div>
              </div>

              <div class="steps">
                <h3 style="color:#1E40AF;margin:0 0 16px;font-size:18px;">🚀 Quick Start Guide:</h3>
                <div class="step">1️⃣ <strong>Visit:</strong> <a href="${appUrl}/login" style="color:#2563EB;">${appUrl}/login</a></div>
                <div class="step">2️⃣ <strong>Enter your email:</strong> ${email}</div>
                <div class="step">3️⃣ <strong>Use the OTP above</strong> as your temporary password</div>
                <div class="step">4️⃣ <strong>Create a secure password</strong> when prompted</div>
                <div class="step">5️⃣ <strong>Start exploring</strong> your personalized dashboard!</div>
              </div>

              <div class="info-box">
                <p style="margin:0;"><strong>🔒 Security Reminder:</strong> For your account security, please change your password immediately after first login. Never share your credentials with anyone.</p>
              </div>

              <div style="text-align: center;">
                <a href="${appUrl}/login" class="button">🎯 Login to Dashboard →</a>
              </div>

              <div style="background:#FFFBEB;padding:16px;border-radius:8px;margin:24px 0;text-align:center;">
                <p style="margin:0;color:#B8860B;font-weight:600;">Need help? Contact your administrator or visit ${appUrl}</p>
              </div>

              <div class="footer">
                <p style="margin:8px 0;"><span class="brand">${companyName}</span></p>
                <p style="margin:8px 0;">This is an automated message. Do not reply to this email.</p>
                <p style="margin:8px 0;">If you didn't request this account, please contact your administrator immediately.</p>
                <p style="margin:16px 0 0;color:#94A3B8;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};

// Send email
export const sendEmail = async (to, templateName, templateData) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) throw new Error(`Email template '${templateName}' not found`);

    const emailContent = template(templateData);
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"HoneyPot CRM" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} (${result.messageId})`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
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
    const result = await transporter.sendMail({
      from: `"HoneyPot CRM" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent || '<p>Please find the attached report.</p>',
      attachments
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ sendEmailWithAttachment error:', error);
    return { success: false, error: error.message };
  }
};
