import OnboardingService from "../services/onboarding/onboardingService.js";
import EmailService from "../services/email/emailService.js";
import Organization from "../models/Organization.js";

/**
 * @desc    Create employee with onboarding (Admin only)
 * @route   POST /api/onboarding/create-employee
 * @access  Private (Admin only)
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      email,
      designation,
      salary,
      phone,
      department,
      joiningDate
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !designation || !salary || !phone) {
      return res.status(400).json({
        success: false,
        error: "Full name, email, designation, salary, and phone are required"
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address"
      });
    }

    // Validate salary
    if (salary < 0) {
      return res.status(400).json({
        success: false,
        error: "Salary must be a positive number"
      });
    }

    const result = await OnboardingService.createEmployee({
      fullName,
      email,
      designation,
      salary,
      phone,
      department,
      joiningDate
    }, req.user.id);

    // Send offer letter email (brand-aware)
    try {
      let org = null;
      try {
        org = await Organization.findById(req.user.organizationId)
          .select("companyName logo theme emailSettings")
          .lean();
      } catch (e) {
        // ignore branding fetch failures, fall back to defaults
      }
      await EmailService.sendOfferLetterEmail(result.onboarding.offerDetails, result.token, org);
    } catch (emailError) {
      console.error("Failed to send offer letter email:", emailError);
      // Don't fail the request if email fails, but log it
      // In production, you might want to retry or queue this
    }

    return res.status(201).json({
      success: true,
      message: "Offer letter sent successfully! Employee will receive an email with onboarding instructions.",
      data: {
        employee: result.employee,
        onboarding: result.onboarding
      }
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while creating employee"
    });
  }
};

/**
 * @desc    Get onboarding details by token
 * @route   GET /api/onboarding/:token
 * @access  Public
 */
export const getOnboardingDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await OnboardingService.getOnboardingDetailsByToken(token);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Get onboarding details error:", error);
    if (error.message === "This onboarding link has expired") {
      return res.status(410).json({
        success: false,
        error: error.message,
      });
    } else if (error.message === "This offer has been revoked by the admin") {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    } else if (error.message === "Onboarding already completed") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message === "Invalid onboarding link") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching onboarding details",
    });
  }
};

/**
 * @desc    Accept offer
 * @route   POST /api/onboarding/:token/accept
 * @access  Public
 */
export const acceptOffer = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await OnboardingService.acceptOffer(token);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Accept offer error:", error);
    if (error.message.includes("Cannot accept offer with status")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("This onboarding link has expired")) {
      return res.status(410).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("Invalid onboarding link")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while accepting offer",
    });
  }
};

/**
 * @desc    Reject offer
 * @route   POST /api/onboarding/:token/reject
 * @access  Public
 */
export const rejectOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    const result = await OnboardingService.rejectOffer(token, reason);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Reject offer error:", error);
    if (error.message.includes("Cannot reject offer with status")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("This onboarding link has expired")) {
      return res.status(410).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("Invalid onboarding link")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while rejecting offer",
    });
  }
};

/**
 * @desc    Complete onboarding
 * @route   POST /api/onboarding/:token/complete
 * @access  Public
 */
export const completeOnboarding = async (req, res) => {
  try {
    const { token } = req.params;
    const {
      password,
      cnicImage,
      avatar,
      github,
      linkedin,
      dateOfBirth,
      address,
      emergencyContact,
    } = req.body;

    const result = await OnboardingService.completeOnboarding(token, {
      password,
      cnicImage,
      avatar,
      github,
      linkedin,
      dateOfBirth,
      address,
      emergencyContact,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Complete onboarding error:", error);
    if (error.message.includes("Cannot complete onboarding with status")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("Password must be at least")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("at least one social link")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("Employee account not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while completing onboarding",
    });
  }
};

/**
 * @desc    Get all onboarding status (Admin only)
 * @route   GET /api/onboarding/admin/status
 * @access  Private (Admin)
 */
export const getAllOnboardingStatus = async (req, res) => {
  try {
    const result = await OnboardingService.getAllOnboardingStatus(req.query);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Get onboarding status error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching onboarding status",
    });
  }
};

/**
 * @desc    Revoke onboarding (Admin only)
 * @route   POST /api/onboarding/:id/revoke
 * @access  Private (Admin)
 */
export const revokeOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await OnboardingService.revokeOnboarding(id, reason, req.user.id);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Revoke onboarding error:", error);
    if (error.message.includes("Cannot revoke onboarding with status")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("Onboarding not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while revoking onboarding",
    });
  }
};

/**
 * @desc    Resend offer letter (Admin only)
 * @route   POST /api/onboarding/:id/resend
 * @access  Private (Admin)
 */
export const resendOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await OnboardingService.resendOfferLetter(id);

    // Send offer letter email with new token
    try {
      const onboarding = await import("../models/Onboarding.js").then(m => m.default);
      const onboardingRecord = await onboarding.findById(id);
      if (onboardingRecord) {
        let org = null;
        try {
          org = await Organization.findById(onboardingRecord.organizationId)
            .select("companyName logo theme emailSettings")
            .lean();
        } catch (e) {}
        await EmailService.sendOfferLetterEmail(onboardingRecord.offerDetails, result.token, org);
      }
    } catch (emailError) {
      console.error("Failed to send offer letter email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error("Resend offer letter error:", error);
    if (error.message.includes("Can only resend offer letters")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else if (error.message.includes("Onboarding not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while resending offer letter",
    });
  }
};

/**
 * @desc    Ensure employment form link for an accepted onboarding
 * @route   POST /api/onboarding/:token/employment-form
 * @access  Public
 */
export const ensureEmploymentForm = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await OnboardingService.ensureEmploymentFormToken(token);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const msg = error.message || "Server error while ensuring employment form";
    const code = msg.includes("accepted") ? 400 : msg.includes("Invalid onboarding") ? 404 : 500;
    return res.status(code).json({ success: false, error: msg });
  }
};

export default {
  createEmployee,
  getOnboardingDetails,
  acceptOffer,
  rejectOffer,
  completeOnboarding,
  getAllOnboardingStatus,
  revokeOnboarding,
  resendOfferLetter,
  ensureEmploymentForm,
};
