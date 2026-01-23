import eventService from '../services/eventService.js';
import emailService from '../services/email/emailService.js';

export const initAppointmentSubscribers = () => {
  eventService.on('appointment.accepted', async ({ appointmentLetter }) => {
    try {
      console.log(`Processing appointment acceptance for ${appointmentLetter.employeeEmail}`);

      const confirmationEmailTemplate = `
        <h1>Offer Accepted!</h1>
        <p>Dear ${appointmentLetter.employeeName},</p>
        <p>We have successfully received your acceptance of the appointment letter.</p>
        <p>We are excited to have you join our team!</p>
        <p>Our HR team will review your acceptance and send you the necessary employment forms shortly.</p>
      `;

      await emailService.sendEmail({
        to: appointmentLetter.employeeEmail,
        subject: "Confirmation: Appointment Letter Accepted",
        html: confirmationEmailTemplate,
      });

      console.log(`Successfully processed appointment acceptance for ${appointmentLetter.employeeEmail}`);
    } catch (error) {
      console.error(`Error processing appointment acceptance for ${appointmentLetter.employeeEmail}:`, error);
    }
  });
};
