import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import React from "react";
import OfferLetterEmail from "../../emails/OfferLetterEmail.js";
import ReminderEmail from "../../emails/ReminderEmail.js";
import DocumentNotificationEmail from "../../emails/DocumentNotificationEmail.js";
import DocumentSignedEmail from "../../emails/DocumentSignedEmail.js";
import DocumentDeclinedEmail from "../../emails/DocumentDeclinedEmail.js";
import StatusUpdateEmail from "../../emails/StatusUpdateEmail.js";
import LateArrivalEmail from "../../emails/LateArrivalEmail.js";
import AbsentNotificationEmail from "../../emails/AbsentNotificationEmail.js";
import EmploymentFormEmail from "../../emails/EmploymentFormEmail.js";
import EmploymentFormRevisionEmail from "../../emails/EmploymentFormRevisionEmail.js";
import EmploymentFormApprovedEmail from "../../emails/EmploymentFormApprovedEmail.js";
import ContractEmail from "../../emails/ContractEmail.js";
import CandidateAcknowledgementEmail from "../../emails/CandidateAcknowledgementEmail.js";
import ScreeningInviteEmail from "../../emails/ScreeningInviteEmail.js";
import InterviewInviteEmail from "../../emails/InterviewInviteEmail.js";
import RejectionEmail from "../../emails/RejectionEmail.js";
/**
 * Email Service - Handles all email-related business logic
 */

class EmailService {
  /**
   * Create reusable email transporter
   * @returns {Object} Email transporter
   */
  createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send candidate acknowledgement (upon creation/shortlisting)
   */
  async sendCandidateAcknowledgement(org, candidate, jobTitle, department) {
    const html = await render(
      React.createElement(CandidateAcknowledgementEmail, {
        org,
        candidate,
        jobTitle,
        department,
      })
    );
    const subject = `Application received - ${org?.companyName || "Our Company"}`;
    return this.sendEmail({ to: candidate.email, subject, html });
  }

  /**
   * Send screening invite using branding-aware template
   */
  async sendScreeningInvite(org, to, subject, message, candidate = {}, jobTitle) {
    const fallbackSubject = `Screening Invitation${jobTitle ? ` - ${jobTitle}` : ''}`;
    const fallbackMessage = `We'd like to invite you to a short screening as the next step in our hiring process.

This includes a brief online assessment and/or a 15–20 minute call.

Please reply with your availability for the next 2–3 days.`;
    const finalSubject = subject || fallbackSubject;
    const finalMessage = message || fallbackMessage;
    const html = await render(
      React.createElement(ScreeningInviteEmail, {
        org,
        candidate,
        subject: finalSubject,
        message: finalMessage,
        jobTitle,
      })
    );
    return this.sendEmail({ to, subject: finalSubject, html, text: finalMessage });
  }

  /**
   * Send interview invite using branding-aware template
   */
  async sendInterviewInvite(org, candidate, application, interview, subjectOverride = null, message = "") {
    // Hardcoded subject per request
    const subject = `Your Interview Has Been Scheduled – ${application?.positionTitle || "Position"}`;
    const html = await render(
      React.createElement(InterviewInviteEmail, {
        org,
        candidate,
        application,
        interview,
        message,
      })
    );
    const textParts = [];
    if (interview?.scheduledAt) {
      const when = new Date(interview.scheduledAt).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      textParts.push(`When: ${when}`);
    }
    if (interview?.duration) textParts.push(`Duration: ${interview.duration} minutes`);
    if (interview?.meetingLink) textParts.push(`Meeting Link: ${interview.meetingLink}`);
    if (interview?.location) textParts.push(`Location: ${interview.location}`);
    const text = `Interview Invitation\n${textParts.join("\n")}${message ? `\n\n${message}` : ""}`;
    return this.sendEmail({ to: candidate.email, subject, html, text });
  }

  /**
   * Send rejection email using branding-aware template
   */
  async sendRejectionEmail(org, candidate, jobTitle, reason) {
    const subject = `Application Update - ${jobTitle || org?.companyName || "Our Company"}`;
    const html = await render(
      React.createElement(RejectionEmail, { org, candidate, jobTitle, reason })
    );
    const text = `We appreciate your interest. Unfortunately, we won't proceed at this time.${reason ? ` Reason: ${reason}` : ""}`;
    return this.sendEmail({ to: candidate.email, subject, html, text });
  }

  /**
   * Base send email function
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (optional)
   * @returns {Promise<Object>} Email send result
   */
  async sendEmail({ to, subject, html, text, cc, bcc, org }) {
    try {
      const transporter = this.createTransporter();

      const mailOptions = {
        from: `"${(org && (org.emailSettings?.fromName || org.companyName)) || process.env.FROM_NAME || "Techxudo OMS"}" <${
          process.env.FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to,
        subject,
        html,
        text: text || "",
        cc,
        bcc,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send offer letter email using React Email
   * @param {Object} offerData - Offer details
   * @param {string} token - Onboarding token
   * @returns {Promise<Object>} Email send result
   */
  async sendOfferLetterEmail(offerData, token, org = null) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      // Render React component to HTML
      const html = await render(
        React.createElement(OfferLetterEmail, {
          offerData,
          token,
          frontendUrl,
          org,
        })
      );

      // Generate plain text version
      const { fullName, designation, department, salary, joiningDate } =
        offerData;
      const onboardingUrl = `${frontendUrl}/onboarding/${token}`;

      const formattedSalary = new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
      }).format(salary);

      const formattedDate = new Date(joiningDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const company = (org && org.companyName) || "Our Company";
      const text = `
Congratulations, ${fullName}!

We are pleased to offer you the position of ${designation} at ${company}.

Offer Details:
- Position: ${designation}
- Department: ${department || "To be assigned"}
- Salary: ${formattedSalary} per month
- Joining Date: ${formattedDate}

To review and respond to this offer, please visit:
${onboardingUrl}

This link will expire in 7 days.

Best regards,
${company} HR Team
      `.trim();

      await this.sendEmail({
        to: offerData.email,
        subject: `🎉 Offer Letter - Welcome to ${(org && org.companyName) || "Our Company"}`,
        html,
        text,
        org,
      });

      console.log(`📧 Offer letter sent to ${offerData.email}`);
      return {
        success: true,
        message: `Offer letter sent to ${offerData.email}`,
      };
    } catch (error) {
      console.error("Error sending offer letter:", error);
      throw error;
    }
  }

  /**
   * Send reminder email using React Email
   * @param {Object} offerData - Offer details
   * @param {string} token - Onboarding token
   * @param {string} reminderType - Type of reminder (first, second, final)
   * @returns {Promise<Object>} Email send result
   */
  async sendReminderEmail(offerData, token, reminderType) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      // Render React component to HTML
      const html = await render(
        React.createElement(ReminderEmail, {
          offerData,
          token,
          frontendUrl,
          reminderType,
        })
      );

      const reminderSubjects = {
        first: "⏰ Reminder: Your Offer Letter is Waiting",
        second: "⏰ Reminder: 2 Days Left to Respond",
        final: "⚠️ Final Reminder: Offer Expires Tomorrow",
      };

      const subject = reminderSubjects[reminderType] || reminderSubjects.first;

      // Generate plain text version
      const { fullName, designation } = offerData;
      const onboardingUrl = `${frontendUrl}/onboarding/${token}`;

      const reminderMessages = {
        first: "You still have 4 days to respond",
        second: "Only 2 days remaining!",
        final: "This is your final reminder - expires in 24 hours!",
      };

      const urgency = reminderMessages[reminderType] || reminderMessages.first;

      const text = `
Hi ${fullName},

We noticed you haven't responded to your offer letter for the ${designation} position yet.

${urgency}

Please visit: ${onboardingUrl}

If you have any questions, please contact us.

Best regards,
Techxudo HR Team
      `.trim();

      await this.sendEmail({
        to: offerData.email,
        subject,
        html,
        text,
      });

      console.log(`📧 ${reminderType} reminder sent to ${offerData.email}`);
      return {
        success: true,
        message: `${reminderType} reminder sent to ${offerData.email}`,
      };
    } catch (error) {
      console.error(`Error sending ${reminderType} reminder:`, error);
      throw error;
    }
  }

  /**
   * Send document notification email to employee using React Email
   * @param {Object} employee - Employee details
   * @param {Object} admin - Admin who sent the document
   * @param {Object} document - Document details
   * @returns {Promise<Object>} Email send result
   */
  async sendDocumentNotification(employee, admin, document) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      // Render React component to HTML
      const html = await render(
        React.createElement(DocumentNotificationEmail, {
          employee,
          admin,
          document,
          frontendUrl,
        })
      );

      // Generate plain text version
      const text = `
Hi ${employee.fullName},

${admin.fullName} has sent you a ${document.type.toUpperCase()} titled "${document.title}" for your signature.

Document Details:
- Type: ${document.type.toUpperCase()}
- Title: ${document.title}
- Sent by: ${admin.fullName} (${admin.email})
- Sent on: ${new Date(document.sentAt).toLocaleString()}

This is a legally binding document. Please review carefully before signing.

To view and sign the document, visit:
${frontendUrl}/employee/documents/${document._id}/sign

If you have any questions, please contact ${admin.fullName} at ${admin.email}.

Best regards,
Techxudo Office Management System
      `.trim();

      await this.sendEmail({
        to: employee.email,
        subject: `Action Required: Sign Your ${document.type.toUpperCase()} - ${document.title}`,
        html,
        text,
      });

      console.log(`📧 Document notification sent to ${employee.email}`);
      return {
        success: true,
        message: `Document notification sent to ${employee.email}`,
      };
    } catch (error) {
      console.error("Error sending document notification:", error);
      throw error;
    }
  }

  /**
   * Send document signed notification email to admin using React Email
   * @param {Object} admin - Admin to notify
   * @param {Object} employee - Employee who signed
   * @param {Object} document - Document details
   * @returns {Promise<Object>} Email send result
   */
  async sendDocumentSignedNotification(admin, employee, document) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      // Render React component to HTML
      const html = await render(
        React.createElement(DocumentSignedEmail, {
          admin,
          employee,
          document,
          frontendUrl,
        })
      );

      // Generate plain text version
      const text = `
Hi ${admin.fullName},

${employee.fullName} has signed the ${document.type.toUpperCase()} titled "${document.title}".

Signature Details:
- Signed by: ${employee.fullName} (${employee.email})
- Document: ${document.title}
- Signed at: ${new Date(document.signature.signedAt).toLocaleString()}

To download the signed document, visit:
${frontendUrl}/admin/documents/${document._id}/download

Best regards,
Techxudo Office Management System
      `.trim();

      await this.sendEmail({
        to: admin.email,
        subject: `Document Signed: ${document.title}`,
        html,
        text,
      });

      console.log(`📧 Document signed notification sent to ${admin.email}`);
      return {
        success: true,
        message: `Document signed notification sent to ${admin.email}`,
      };
    } catch (error) {
      console.error("Error sending document signed notification:", error);
      throw error;
    }
  }

  /**
   * Send document declined notification email to admin using React Email
   * @param {Object} admin - Admin to notify
   * @param {Object} employee - Employee who declined
   * @param {Object} document - Document details
   * @returns {Promise<Object>} Email send result
   */
  async sendDocumentDeclinedNotification(admin, employee, document) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      // Render React component to HTML
      const html = await render(
        React.createElement(DocumentDeclinedEmail, {
          admin,
          employee,
          document,
        })
      );

      // Generate plain text version
      const text = `
Hi ${admin.fullName},

${employee.fullName} has declined the ${document.type.toUpperCase()} titled "${document.title}".

Details:
- Declined by: ${employee.fullName} (${employee.email})
- Document: ${document.title}
- Declined at: ${new Date().toLocaleString()}
- Reason: ${document.rejectionReason || "No reason provided"}

You may want to contact the employee to discuss the matter or create a new document.

Best regards,
Techxudo Office Management System
      `.trim();

      await this.sendEmail({
        to: admin.email,
        subject: `Document Declined: ${document.title}`,
        html,
        text,
      });

      console.log(`📧 Document declined notification sent to ${admin.email}`);
      return {
        success: true,
        message: `Document declined notification sent to ${admin.email}`,
      };
    } catch (error) {
      console.error("Error sending document declined notification:", error);
      throw error;
    }
  }
  async sendStatusUpdateEmail(user, type, status, comments) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4080";

      const html = await render(
        React.createElement(StatusUpdateEmail, {
          employeeName: user.fullName,
          requestType: type,
          status,
          comments,
          frontendUrl,
        })
      );

      await this.sendEmail({
        to: user.email,
        subject: `Update on your ${type} Request`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending status email:", error);
      // Don't throw, just log, so we don't block the main flow
      return { success: false };
    }
  }

  /**
   * Send check-in reminder to employee
   */
  async sendCheckInReminder(employee) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Check-In Reminder</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${employee.fullName}</strong>,</p>
              <p>This is a friendly reminder to check in for today's attendance.</p>
              <p>Please check in as soon as you arrive at the office.</p>
              <a href="${process.env.FRONTEND_URL || "http://localhost:4080"}/employee/attendance" class="button">Check In Now</a>
              <p>Thank you!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmail({
        to: employee.email,
        subject: "⏰ Reminder: Please Check In",
        html,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending check-in reminder:", error);
      return { success: false };
    }
  }

  /**
   * Send check-out reminder to employee
   */
  async sendCheckOutReminder(employee) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏁 Check-Out Reminder</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${employee.fullName}</strong>,</p>
              <p>Don't forget to check out before leaving!</p>
              <p>This helps us maintain accurate attendance records.</p>
              <a href="${process.env.FRONTEND_URL || "http://localhost:4080"}/employee/attendance" class="button">Check Out Now</a>
              <p>Have a great evening!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmail({
        to: employee.email,
        subject: "🏁 Reminder: Please Check Out",
        html,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending check-out reminder:", error);
      return { success: false };
    }
  }

  /**
   * Send absentee alert to admins
   */
  async sendAbsenteeAlert(absentees, adminEmails) {
    try {
      const absenteeList = absentees
        .map(
          (emp) =>
            `<li>${emp.fullName} - ${emp.designation} (${emp.department})</li>`
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .stats { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            ul { background: white; padding: 20px 40px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Absentee Alert</h1>
            </div>
            <div class="content">
              <div class="stats">
                <h2>📊 Today's Absentees: ${absentees.length}</h2>
                <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <h3>Employee List:</h3>
              <ul>${absenteeList}</ul>
              <p><em>This is an automated alert from the Attendance System.</em></p>
            </div>
          </div>
        </body>
        </html>
      `;

      for (const adminEmail of adminEmails) {
        await this.sendEmail({
          to: adminEmail,
          subject: `🚨 Absentee Alert - ${absentees.length} employees absent`,
          html,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending absentee alert:", error);
      return { success: false };
    }
  }

  /**
   * Send daily attendance report to admins
   */
  async sendDailyAttendanceReport(report, adminEmails) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .stat-card { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Attendance Report</h1>
              <p>${new Date(report.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div class="content">
              <div class="stat-card">
                <div>Total Employees</div>
                <div class="stat-number">${report.totalEmployees}</div>
              </div>
              <div class="stat-card">
                <div>✅ Present</div>
                <div class="stat-number" style="color: #10b981;">${report.presentCount}</div>
              </div>
              <div class="stat-card">
                <div>❌ Absent</div>
                <div class="stat-number" style="color: #ef4444;">${report.absentCount}</div>
              </div>
              <div class="stat-card">
                <div>⏰ Late Arrivals</div>
                <div class="stat-number" style="color: #f59e0b;">${report.lateCount}</div>
              </div>
              <p style="margin-top: 20px;"><em>This is an automated daily report from the Attendance System.</em></p>
            </div>
          </div>
        </body>
        </html>
      `;

      for (const adminEmail of adminEmails) {
        await this.sendEmail({
          to: adminEmail,
          subject: `📊 Daily Attendance Report - ${new Date(report.date).toLocaleDateString()}`,
          html,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending daily report:", error);
      return { success: false };
    }
  }

  /**
   * Send late arrival notification to employee
   */
  async sendLateArrivalNotification(employee, checkInTime, minutesLate) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4080";

      // Format date and time for Pakistan timezone (PKT - UTC+5)
      const pktDate = new Date(checkInTime.getTime() + 5 * 60 * 60 * 1000);
      const date = pktDate.toLocaleDateString("en-PK", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const time = pktDate.toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const html = await render(
        React.createElement(LateArrivalEmail, {
          employeeName: employee.fullName,
          checkInTime: time,
          minutesLate,
          date,
          frontendUrl,
        })
      );

      await this.sendEmail({
        to: employee.email,
        subject: `⏰ Late Arrival Notification - ${minutesLate} minutes late`,
        html,
      });

      console.log(`📧 Late arrival notification sent to ${employee.email}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending late arrival notification:", error);
      return { success: false };
    }
  }

  /**
   * Send absent notification to employee
   */
  async sendAbsentNotification(employee) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4080";

      // Format date for Pakistan timezone (PKT - UTC+5)
      const now = new Date();
      const pktDate = new Date(now.getTime() + 5 * 60 * 60 * 1000);
      const date = pktDate.toLocaleDateString("en-PK", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const html = await render(
        React.createElement(AbsentNotificationEmail, {
          employeeName: employee.fullName,
          date,
          frontendUrl,
        })
      );

      await this.sendEmail({
        to: employee.email,
        subject: `❌ Absent Notification - ${date}`,
        html,
      });

      console.log(`📧 Absent notification sent to ${employee.email}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending absent notification:", error);
      return { success: false };
    }
  }
  /**
   * Send employment form email using React Email
   * @param {Object} employee - Employee details
   * @param {string} token - Form token
   * @returns {Promise<Object>} Email send result
   */
  async sendEmploymentFormEmail(employee, token, org = null) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const formLink = `${frontendUrl}/employment/form/${token}`;

      // Render React component to HTML
      const html = await render(
        React.createElement(EmploymentFormEmail, {
          employeeName: employee.fullName,
          formLink,
          org,
        })
      );

      // Generate plain text version
      const company = (org && org.companyName) || "Our Company";
      const text = `
Dear ${employee.fullName},

To proceed with your onboarding at ${company}, we need you to complete your employment information form.

Please visit: ${formLink}

This link will expire in 7 days.

Best regards,
${company} Team
      `.trim();

      await this.sendEmail({
        to: employee.email,
        subject: `Action Required: Complete Your Employment Form - ${company}`,
        html,
        text,
        org,
      });

    console.log(`📧 Employment form email sent to ${employee.email}`);
    return {
      success: true,
      message: `Employment form email sent to ${employee.email}`,
    };
  } catch (error) {
    console.error("Error sending employment form email:", error);
    return { success: false };
  }
}

  async sendEmploymentFormRevisionEmail(employee, token, org = null, fields = [], notes = "") {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const formLink = `${frontendUrl}/employment/form/${token}`;
      const html = await render(
        React.createElement(EmploymentFormRevisionEmail, {
          employeeName: employee.fullName,
          formLink,
          org,
          requestedFields: fields,
          notes,
        })
      );

      const company = (org && org.companyName) || "Our Company";
      const text = `Hi ${employee.fullName},\n\nOur HR team reviewed your employment form and needs revisions to the following sections: ${
        fields.join(", ") || "the provided information"
      }.\n\n${notes ? `Notes: ${notes}\n\n` : ""}Please update the form here: ${formLink}\n\nOnce completed, we will continue with the next steps in the hiring process.\n\nBest regards,\n${company} HR Team`;

      await this.sendEmail({
        to: employee.email,
        subject: `Action required: Update your employment form - ${company}`,
        html,
        text,
        org,
      });

      console.log(`📧 Employment form revision email sent to ${employee.email}`);
      return {
        success: true,
        message: `Employment form revision email sent to ${employee.email}`,
      };
    } catch (error) {
      console.error("Error sending employment form revision email:", error);
      return { success: false };
    }
  }

  async sendEmploymentFormApprovedEmail(employee, org = null, notes = "") {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const portalUrl = `${frontendUrl}/login`;
      const html = await render(
        React.createElement(EmploymentFormApprovedEmail, {
          employeeName: employee.fullName,
          org,
          portalUrl,
          notes,
        })
      );

      const company = (org && org.companyName) || "Our Company";
      const subject = `Next steps from ${company} HR`;
      const textLines = [
        `Hi ${employee.fullName},`,
        "",
        "Your employment form has been approved by HR.",
        "You can expect:",
        "- An appointment link to confirm the role and start date.",
        "- A contract for your review and e-signature.",
        "- Credentials and onboarding instructions once the contract is signed.",
        "",
        `Portal: ${portalUrl}`,
      ];
      const text = textLines.join("\n");

      await this.sendEmail({
        to: employee.email,
        subject,
        html,
        text,
        org,
      });

      console.log(`📧 Employment form approval email sent to ${employee.email}`);
      return {
        success: true,
        message: `Employment form approval email sent to ${employee.email}`,
      };
    } catch (error) {
      console.error("Error sending employment form approval email:", error);
      return { success: false };
    }
  }

  /**
   * Send contract email using React Email
   * @param {Object} contractData - Contract details
   * @param {string} token - Signing token
   * @returns {Promise<Object>} Email send result
   */
  async sendContractEmail(contractData, token) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const signingLink = `${frontendUrl}/employment/contract/${token}`;

      // Format start date
      const startDate = contractData.contractDetails?.startDate
        ? new Date(contractData.contractDetails.startDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )
        : "TBD";

      // Render React component to HTML
      const html = await render(
        React.createElement(ContractEmail, {
          employeeName: contractData.employeeName,
          position: contractData.contractDetails?.position || "N/A",
          department: contractData.contractDetails?.department || "N/A",
          startDate,
          baseSalary:
            contractData.contractDetails?.compensation?.baseSalary || 0,
          signingLink,
        })
      );

      // Generate plain text version
      const formattedSalary = new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
      }).format(contractData.contractDetails?.compensation?.baseSalary || 0);

      const text = `
Dear ${contractData.employeeName},

Congratulations! Your employment contract is now ready for your review and signature.

Contract Details:
- Position: ${contractData.contractDetails?.position || "N/A"}
- Department: ${contractData.contractDetails?.department || "N/A"}
- Start Date: ${startDate}
- Base Salary: ${formattedSalary} per month

To review and sign your contract, please visit:
${signingLink}

⚠️ Important: This signing link will expire in 7 days.

If you have any questions, please contact our HR department.

Best regards,
The Techxudo Team
      `.trim();

      await this.sendEmail({
        to: contractData.employeeEmail,
        subject: "📄 Your Employment Contract is Ready for Signing",
        html,
        text,
      });

      console.log(`📧 Contract email sent to ${contractData.employeeEmail}`);
      return {
        success: true,
        message: `Contract email sent to ${contractData.employeeEmail}`,
      };
    } catch (error) {
      console.error("Error sending contract email:", error);
      throw error;
    }
  }
}

export default new EmailService();
