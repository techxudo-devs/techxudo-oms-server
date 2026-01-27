import AppointmentLetter from "../models/employment/AppointmentLetter.js";
import crypto from "crypto";
import emailService from "../services/email/emailService.js";
import eventService from "../services/eventService.js";
import { generateAppointmentLetterTemplate } from "../emails/appointment-letter-template.js";

/**
 * Appointment Letter Service - Handles all appointment letter business logic
 */

class AppointmentLetterService {
  /**
   * Send appointment letter to employee
   * @param {Object} appointmentLetterData - Appointment letter data
   * @returns {Promise<Object>} Created appointment letter object
   */
  async sendAppointmentLetter(appointmentLetterData) {
    try {
      // Generate a unique token for this appointment letter
      const token = crypto.randomBytes(32).toString("hex");

      // Prepare the appointment letter data
      const newAppointmentLetterData = {
        ...appointmentLetterData,
        token,
        sentAt: new Date(),
      };

      // Create the appointment letter
      const appointmentLetter = new AppointmentLetter(newAppointmentLetterData);
      await appointmentLetter.save();

      // Send email with appointment letter details
      const emailTemplate = generateAppointmentLetterTemplate(
        appointmentLetter.employeeName,
        appointmentLetter.letterContent,
        `${process.env.FRONTEND_URL || "http://localhost:4080"}/onboarding/appointment/${token}`
      );

      await emailService.sendEmail({
        to: appointmentLetter.employeeEmail,
        subject: appointmentLetter.letterContent.subject,
        html: emailTemplate,
      });

      return appointmentLetter;
    } catch (error) {
      throw new Error(`Error sending appointment letter: ${error.message}`);
    }
  }

  /**
   * Get all appointment letters with filtering, pagination, and sorting
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter criteria
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Paginated results
   */
  async getAppointmentLetters({ filter = {}, page = 1, limit = 10 }) {
    try {
      const skip = (page - 1) * limit;

      const [appointmentLetters, total] = await Promise.all([
        AppointmentLetter.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AppointmentLetter.countDocuments(filter),
      ]);

      return {
        appointmentLetters,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching appointment letters: ${error.message}`);
    }
  }

  /**
   * Get appointment letter by ID
   * @param {string} appointmentLetterId - Appointment letter ID
   * @returns {Promise<Object>} Appointment letter object
   */
  async getAppointmentLetterById(appointmentLetterId) {
    try {
      return await AppointmentLetter.findById(appointmentLetterId);
    } catch (error) {
      throw new Error(`Error fetching appointment letter: ${error.message}`);
    }
  }

  /**
   * Get appointment letter by token
   * @param {string} token - Appointment letter token
   * @returns {Promise<Object>} Appointment letter object
   */
  async getAppointmentLetterByToken(token) {
    try {
      return await AppointmentLetter.findOne({ token });
    } catch (error) {
      throw new Error(
        `Error fetching appointment letter by token: ${error.message}`
      );
    }
  }

  /**
   * Mark appointment letter as viewed
   * @param {string} token - Appointment letter token
   * @returns {Promise<Object>} Updated appointment letter object
   */
  async markAsViewed(token) {
    try {
      const appointment = await AppointmentLetter.findOne({ token });
      if (!appointment) return null;

      // Only mark as viewed if it hasn't been responded to
      if (appointment.status === "sent") {
        appointment.status = "viewed";
        appointment.viewedAt = new Date();
        return await appointment.save();
      }

      return appointment;
    } catch (error) {
      throw new Error(
        `Error marking appointment letter as viewed: ${error.message}`
      );
    }
  }

  /**
   * Respond to appointment letter (accept/reject)
   * @param {string} token - Appointment letter token
   * @param {string} action - 'accept' or 'reject'
   * @param {string} reason - Reason for rejection (optional)
   * @returns {Promise<Object>} Updated appointment letter object
   */
  async respondToAppointmentLetter(token, action, reason) {
    try {
      const updateData = {
        status: action === "accept" ? "accepted" : "rejected",
        respondedAt: new Date(),
      };

      if (reason) {
        updateData.response = reason;
      }

      const appointmentLetter = await AppointmentLetter.findOneAndUpdate(
        { token },
        updateData,
        { new: true }
      );

      if (!appointmentLetter) {
        return null;
      }

      // If accepted, trigger the next step in onboarding via event
      if (action === "accept") {
        eventService.emit("appointment.accepted", { appointmentLetter });
      }

      return appointmentLetter;
    } catch (error) {
      throw new Error(
        `Error responding to appointment letter: ${error.message}`
      );
    }
  }

  /**
   * Update appointment letter status
   * @param {string} appointmentLetterId - Appointment letter ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated appointment letter object
   */
  async updateAppointmentLetterStatus(appointmentLetterId, status) {
    try {
      const validStatuses = ["sent", "viewed", "accepted", "rejected"];

      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      return await AppointmentLetter.findByIdAndUpdate(
        appointmentLetterId,
        { status },
        { new: true }
      );
    } catch (error) {
      throw new Error(
        `Error updating appointment letter status: ${error.message}`
      );
    }
  }
}

export default new AppointmentLetterService();
