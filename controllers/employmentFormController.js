import EmploymentFormService from "../services/employment/employmentFormService.js";
import Organization from "../models/Organization.js";

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * @desc    Create employment form (Admin only)
 * @route   POST /api/employment-forms
 * @access  Private (Admin)
 */
export const createEmploymentForm = async (req, res) => {
  try {
    const employmentFormData = req.body;

    // Add organizationId from request
    employmentFormData.organizationId = req.user.organizationId;

    const result =
      await EmploymentFormService.createEmploymentForm(employmentFormData);

    return res.status(201).json({
      success: true,
      message: "Employment form created successfully",
      data: result.form,
      token: result.token, // Include the unhashed token for frontend use
    });
  } catch (error) {
    console.error("Create employment form error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while creating employment form",
    });
  }
};

/**
 * @desc    Get all employment forms (Admin only)
 * @route   GET /api/employment-forms
 * @access  Private (Admin)
 */
export const getEmploymentForms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
      employeeEmail = "",
      search = "",
    } = req.query;

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    if (status) {
      filter.status = status;
    }
    const normalizedEmail = (employeeEmail || "").trim();
    const searchTerm = (search || "").trim();

    if (normalizedEmail) {
      filter.employeeEmail = {
        $regex: new RegExp(escapeRegex(normalizedEmail), "i"),
      };
    } else if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), "i");
      filter.$or = [
        { employeeEmail: regex },
        { "personalInfo.legalName": regex },
        { "contactInfo.phone": regex },
      ];
    }

    const result = await EmploymentFormService.getEmploymentForms({
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get employment forms error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching employment forms",
    });
  }
};

/**
 * @desc    Get employment form by ID (Admin only)
 * @route   GET /api/employment-forms/:id
 * @access  Private (Admin)
 */
export const getEmploymentForm = async (req, res) => {
  try {
    const result = await EmploymentFormService.getEmploymentFormById(
      req.params.id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Employment form not found",
      });
    }

    // Ensure user has access to this employment form (same organization)
    if (
      result.organizationId.toString() !== req.user.organizationId.toString()
    ) {
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
    console.error("Get employment form by ID error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching employment form",
    });
  }
};

/**
 * @desc    Review employment form (Admin only)
 * @route   PUT /api/employment-forms/:id/review
 * @access  Private (Admin)
 */
export const reviewEmploymentForm = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status is required and must be 'approved' or 'rejected'",
      });
    }

    const result = await EmploymentFormService.reviewEmploymentForm(
      req.params.id,
      status,
      reviewNotes,
      req.user._id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Employment form not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Employment form ${status} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Review employment form error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while reviewing employment form",
    });
  }
};

export const requestEmploymentFormRevision = async (req, res) => {
  try {
    const { notes = "", fields = [] } = req.body;
    const result = await EmploymentFormService.requestRevision(
      req.params.id,
      { notes, fields },
      req.user._id,
    );

    return res.status(200).json({
      success: true,
      message: "Revision requested successfully",
      data: result,
    });
  } catch (error) {
    console.error("Request revision error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while requesting revision",
    });
  }
};

/**
 * @desc    Get employment form by token (Public - for employee view)
 * @route   GET /api/employment-forms/view/:token
 * @access  Public (with token)
 */
export const getEmploymentFormByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Find employment form by token using the static method
    const result = await EmploymentFormService.getEmploymentFormByToken(token);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Employment form not found",
      });
    }

    if (
      result.status &&
      !["draft", "needs_revision"].includes(result.status)
    ) {
      return res.status(409).json({
        success: false,
        error:
          "This employment form has already been submitted. HR is reviewing it and will be in touch shortly.",
        status: result.status,
      });
    }

    // Check if token is expired
    if (result.isTokenExpired()) {
      return res.status(410).json({
        success: false,
        error: "This employment form link has expired",
      });
    }

    // Include organization branding in the response for public rendering
    let org = null;
    try {
      org = await Organization.findById(result.organizationId)
        .select("companyName logo theme")
        .lean();
    } catch (e) {
      // ignore branding fetch error
    }

    return res.status(200).json({
      success: true,
      data: result,
      org,
    });
  } catch (error) {
    console.error("Get employment form by token error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching employment form",
    });
  }
};

/**
 * @desc    Submit employment form by employee
 * @route   POST /api/employment-forms/submit/:token
 * @access  Public (with token)
 */
export const submitEmploymentForm = async (req, res) => {
  try {
    const { token } = req.params;
    const employmentFormData = req.body;

    console.log(
      "DEBUG: Submit request received for token (first 10 chars):",
      token?.substring(0, 10)
    );

    // Validate token parameter
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    const result = await EmploymentFormService.submitEmploymentForm(
      token,
      employmentFormData
    );

    if (!result) {
      console.error(
        "Controller: Employment form not found for token (first 10 chars):",
        token.substring(0, 10)
      );
      return res.status(404).json({
        success: false,
        error:
          "Employment form not found or link is invalid. Please check your link and try again.",
      });
    }

    console.log("Controller: Form submitted successfully, ID:", result._id);

    return res.status(200).json({
      success: true,
      message: "Employment form submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Submit employment form error:", error.message);

    // Handle specific error cases
    if (error.message.includes("already been submitted")) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("expired")) {
      return res.status(410).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("Token is required")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while submitting employment form",
    });
  }
};
