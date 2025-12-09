import AppointmentLetterService from "../services/appointmentLetterService.js";

/**
 * @desc    Send appointment letter to employee
 * @route   POST /api/appointments
 * @access  Private (Admin)
 */
export const sendAppointmentLetter = async (req, res) => {
  try {
    const appointmentLetterData = req.body;

    appointmentLetterData.organizationId = req.user.organizationId;
    appointmentLetterData.createdBy = req.user._id;

    const result = await AppointmentLetterService.sendAppointmentLetter(appointmentLetterData);

    return res.status(201).json({
      success: true,
      message: "Appointment letter sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send appointment letter error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while sending appointment letter",
    });
  }
};

/**
 * @desc    Get all appointment letters (Admin only)
 * @route   GET /api/appointments
 * @access  Private (Admin)
 */
export const getAppointmentLetters = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', employeeEmail = '' } = req.query;

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    if (status) {
      filter.status = status;
    }
    if (employeeEmail) {
      filter.employeeEmail = { $regex: employeeEmail, $options: 'i' };
    }

    const result = await AppointmentLetterService.getAppointmentLetters({
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get appointment letters error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching appointment letters",
    });
  }
};

/**
 * @desc    Get appointment letter by ID (Admin only)
 * @route   GET /api/appointments/:id
 * @access  Private (Admin)
 */
export const getAppointmentLetter = async (req, res) => {
  try {
    const result = await AppointmentLetterService.getAppointmentLetterById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Appointment letter not found",
      });
    }

    // Ensure user has access to this appointment letter (same organization)
    if (result.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get appointment letter by ID error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching appointment letter",
    });
  }
};

/**
 * @desc    View appointment letter (Public route using token)
 * @route   GET /api/appointments/view/:token
 * @access  Public
 */
export const markAsViewed = async (req, res) => {
  try {
    const result = await AppointmentLetterService.getAppointmentLetterByToken(req.params.token);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Appointment letter not found",
      });
    }

    // Mark as viewed
    await AppointmentLetterService.markAsViewed(req.params.token);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Mark appointment letter as viewed error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while marking appointment letter as viewed",
    });
  }
};

/**
 * @desc    Respond to appointment letter (Accept/Reject)
 * @route   POST /api/appointments/respond/:token
 * @access  Public
 */
export const respondToAppointmentLetter = async (req, res) => {
  try {
    const { action, reason } = req.body;

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Action is required and must be 'accept' or 'reject'",
      });
    }

    const result = await AppointmentLetterService.respondToAppointmentLetter(
      req.params.token,
      action,
      reason
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Appointment letter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: action === 'accept' ? "Appointment letter accepted successfully" : "Appointment letter rejected",
      data: result,
    });
  } catch (error) {
    console.error("Respond to appointment letter error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while responding to appointment letter",
    });
  }
};