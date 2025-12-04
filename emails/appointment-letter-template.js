/**
 * Appointment Letter Email Template
 */

export const generateAppointmentLetterTemplate = (
  employeeName,
  letterContent = {},
  viewLetterUrl
) => {
  // Get content from letterContent with fallbacks
  const {
    subject = "New Appointment Letter",
    greeting = "Dear",
    body = "Please find your appointment letter details attached. Please review and let us know if you have any questions.",
    closing = "Best regards,",
    signature = "The HR Team",
  } = letterContent;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            padding: 20px;
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Appointment Letter</h1>
        </div>
        
        <div class="content">
          <p>${greeting} ${employeeName},</p>
          
          <p>${body}</p>
          
          <p>Please click the button below to view and respond to your appointment letter:</p>
          
          <p>
            <a href="${viewLetterUrl}" class="button" target="_blank">
              View Appointment Letter
            </a>
          </p>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${viewLetterUrl}" target="_blank">${viewLetterUrl}</a></p>
          
          <p>${closing}</p>
          <p>${signature}</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from the Onboarding Management System. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;
};

export default generateAppointmentLetterTemplate;