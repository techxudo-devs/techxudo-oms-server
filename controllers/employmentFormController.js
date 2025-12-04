import EmploymentFormService from "../services/employement/employementFormService.js";
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
    const { page = 1, limit = 10, status = "", employeeEmail = "" } = req.query;

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    if (status) {
      filter.status = status;
    }
    if (employeeEmail) {
      filter.employeeEmail = { $regex: employeeEmail, $options: "i" };
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

    // Check if token is expired
    if (result.isTokenExpired()) {
      return res.status(410).json({
        success: false,
        error: "This employment form link has expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
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
    const employmentFormData = req.body;

    const result = await EmploymentFormService.submitEmploymentForm(
      req.params.token,
      employmentFormData
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Employment form not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employment form submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Submit employment form error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while submitting employment form",
    });
  }
};
