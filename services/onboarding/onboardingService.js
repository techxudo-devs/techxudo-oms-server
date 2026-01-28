import Onboarding from "../../models/Onboarding.js";
import User from "../../models/User.js";
import crypto from "crypto";
import EmploymentFormService from "../employment/employmentFormService.js";

/**
 * Onboarding Service - Handles all onboarding-related business logic
 */

class OnboardingService {
  /**
   * Create a new employee with onboarding
   * @param {Object} employeeData - Employee data
   * @param {string} adminId - Admin ID who is creating the employee
   * @returns {Promise<Object>} Created employee and onboarding data
   */
  async createEmployee(employeeData, adminId) {
    try {
      const {
        fullName,
        email,
        designation,
        salary,
        phone,
        department,
        joiningDate
      } = employeeData;

      // Validate required fields
      if (!fullName || !email || !designation || !salary || !phone) {
        throw new Error("Full name, email, designation, salary, and phone are required");
      }

      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please provide a valid email address");
      }

      // Validate salary
      if (salary < 0) {
        throw new Error("Salary must be a positive number");
      }

      // Resolve admin/organization
      const admin = await User.findById(adminId);
      if (!admin || !admin.organizationId) {
        throw new Error("Admin or organization context not found");
      }

      // Check if user already exists (in same org)
      const existingUser = await User.findOne({ email, organizationId: admin.organizationId });
      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Resolve joining date (default +7 days)
      const resolvedJoiningDate = joiningDate
        ? new Date(joiningDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create temporary employee account (inactive until onboarding complete)
      const employee = new User({
        fullName,
        email,
        passwordHash: crypto.randomBytes(32).toString("hex"), // Temporary password
        role: "employee",
        organizationId: admin.organizationId,
        // Note: User schema may not include designation/salary/phone/joiningDate at top-level.
        // These are intentionally not relied on here beyond offer snapshot below.
        isActive: false, // Inactive until onboarding is complete
        isEmailVerified: false
      });

      await employee.save();

      // Create onboarding record
      const onboarding = new Onboarding({
        employeeId: employee._id,
        organizationId: admin.organizationId,
        offerDetails: {
          fullName,
          email,
          designation,
          department: department || "",
          salary,
          joiningDate: resolvedJoiningDate,
          phone
        },
        createdBy: adminId
      });

      // Generate onboarding token
      const token = onboarding.generateToken();
      await onboarding.save();

      return {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          email: employee.email,
          designation: employee.designation,
          department: employee.department,
          salary: employee.salary,
          joiningDate: employee.joiningDate
        },
        onboarding: {
          id: onboarding._id,
          status: onboarding.status,
          expiresAt: onboarding.tokenExpiry,
          offerDetails: onboarding.offerDetails
        },
        token
      };
    } catch (error) {
      throw new Error(`Error creating employee: ${error.message}`);
    }
  }

  /**
   * Get onboarding details by token
   * @param {string} token - Onboarding token
   * @returns {Promise<Object>} Onboarding details
   */
  async getOnboardingDetailsByToken(token) {
    try {
      // Find onboarding by token
      const onboarding = await Onboarding.findByToken(token);

      if (!onboarding) {
        throw new Error("Invalid onboarding link");
      }

      // Check if expired
      if (onboarding.isExpired()) {
        if (onboarding.status === "pending") {
          onboarding.status = "expired";
          await onboarding.save();
        }
        throw new Error("This onboarding link has expired");
      }

      // Check if already completed or revoked
      if (onboarding.status === "completed") {
        throw new Error("Onboarding already completed");
      }

      if (onboarding.status === "revoked") {
        throw new Error("This offer has been revoked by the admin");
      }

      const response = {
        status: onboarding.status,
        offerDetails: onboarding.offerDetails,
        respondedAt: onboarding.respondedAt,
        rejectionReason: onboarding.rejectionReason,
        expiresAt: onboarding.tokenExpiry,
      };

      // Attach minimal org branding
      try {
        const orgModel = (await import("../../models/Organization.js")).default;
        const org = await orgModel
          .findById(onboarding.organizationId)
          .select("companyName logo theme")
          .lean();
        if (org) response.org = org;
      } catch (e) {
        // ignore branding fetch errors
      }

      return response;
    } catch (error) {
      throw new Error(`Error getting onboarding details: ${error.message}`);
    }
  }

  /** Ensure an employment form exists for this onboarding and return a token */
  async ensureEmploymentFormToken(token) {
    const onboarding = await Onboarding.findByToken(token);
    if (!onboarding) throw new Error("Invalid onboarding link");
    if (onboarding.status !== "accepted") throw new Error("Offer must be accepted first");

    const offer = onboarding.offerDetails || {};
    const payload = {
      organizationId: onboarding.organizationId,
      employeeEmail: offer.email,
      personalInfo: { legalName: offer.fullName || "" },
      contactInfo: { email: offer.email, phone: offer.phone || "" },
      addresses: {},
      acceptedPolicies: [],
    };
    const { token: formToken } = await EmploymentFormService.createEmploymentForm(payload);
    return { token: formToken };
  }

  /**
   * Accept an offer
   * @param {string} token - Onboarding token
   * @returns {Promise<Object>} Result of accepting the offer
   */
  async acceptOffer(token) {
    try {
      const onboarding = await Onboarding.findByToken(token);

      if (!onboarding) {
        throw new Error("Invalid onboarding link");
      }

      // Validate status
      if (onboarding.status !== "pending") {
        throw new Error(`Cannot accept offer with status: ${onboarding.status}`);
      }

      // Check if expired
      if (onboarding.isExpired()) {
        onboarding.status = "expired";
        await onboarding.save();
        throw new Error("This onboarding link has expired");
      }

      // Update status to accepted
      onboarding.status = "accepted";
      onboarding.respondedAt = new Date();
      await onboarding.save();

      // Auto-create Employment Form for the candidate and email link
      let createdFormToken = null;
      try {
        const offer = onboarding.offerDetails || {};
        const { organizationId } = onboarding;
        const employmentFormPayload = {
          organizationId,
          // appointmentLetterId intentionally omitted (not required for onboarding-created forms)
          employeeEmail: offer.email,
          personalInfo: { legalName: offer.fullName || "" },
          contactInfo: { email: offer.email, phone: offer.phone || "" },
          addresses: {},
          acceptedPolicies: [],
        };
        const { token: formToken } = await EmploymentFormService.createEmploymentForm(
          employmentFormPayload
        );
        createdFormToken = formToken;
      } catch (err) {
        console.error("Failed to create/send employment form after offer accept:", err?.message || err);
      }

      if (!createdFormToken) {
        throw new Error("Failed to create employment form link. Please try again.");
      }

      return {
        success: true,
        message: "Offer accepted successfully! Continue by completing your employment form.",
        data: {
          status: onboarding.status,
          employmentFormToken: createdFormToken,
        },
      };
    } catch (error) {
      throw new Error(`Error accepting offer: ${error.message}`);
    }
  }

  /**
   * Reject an offer
   * @param {string} token - Onboarding token
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} Result of rejecting the offer
   */
  async rejectOffer(token, reason) {
    try {
      const onboarding = await Onboarding.findByToken(token);

      if (!onboarding) {
        throw new Error("Invalid onboarding link");
      }

      // Validate status
      if (onboarding.status !== "pending") {
        throw new Error(`Cannot reject offer with status: ${onboarding.status}`);
      }

      // Check if expired
      if (onboarding.isExpired()) {
        onboarding.status = "expired";
        await onboarding.save();
        throw new Error("This onboarding link has expired");
      }

      // Update status to rejected
      onboarding.status = "rejected";
      onboarding.respondedAt = new Date();
      onboarding.rejectionReason = reason || "No reason provided";
      await onboarding.save();

      // Deactivate the employee account
      await User.findByIdAndUpdate(onboarding.employeeId, { isActive: false });

      return {
        success: true,
        message: "Offer rejected successfully"
      };
    } catch (error) {
      throw new Error(`Error rejecting offer: ${error.message}`);
    }
  }

  /**
   * Complete onboarding process
   * @param {string} token - Onboarding token
   * @param {Object} onboardingData - Onboarding completion data
   * @returns {Promise<Object>} Result of completing onboarding
   */
  async completeOnboarding(token, onboardingData) {
    try {
      const {
        password,
        cnicImage,
        avatar,
        github,
        linkedin,
        dateOfBirth,
        address,
        emergencyContact,
      } = onboardingData;

      const onboarding = await Onboarding.findByToken(token);

      if (!onboarding) {
        throw new Error("Invalid onboarding link");
      }

      // Must be in accepted status
      if (onboarding.status !== "accepted") {
        throw new Error(`Cannot complete onboarding with status: ${onboarding.status}. Please accept the offer first.`);
      }

      // Validate required fields
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Validate at least one social link
      if (!github && !linkedin) {
        throw new Error("At least one social link (GitHub or LinkedIn) is required");
      }

      // Update user with onboarding data
      const user = await User.findById(onboarding.employeeId);

      if (!user) {
        throw new Error("Employee account not found");
      }

      // Update user fields
      user.passwordHash = password; // Will be hashed by pre-save hook
      user.profile.cnicImage = cnicImage || "";
      user.profile.avatar = avatar || "";
      user.socialLinks.github = github || "";
      user.socialLinks.linkedin = linkedin || "";

      if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
      if (address) user.address = { ...user.address, ...address };
      if (emergencyContact)
        user.emergencyContact = { ...user.emergencyContact, ...emergencyContact };

      user.isActive = true;
      user.isEmailVerified = true;

      await user.save();

      // Update onboarding status
      onboarding.status = "completed";
      onboarding.completedAt = new Date();
      await onboarding.save();

      return {
        success: true,
        message: "Onboarding completed successfully! You can now login with your credentials.",
        data: {
          email: user.email,
          fullName: user.fullName,
        },
      };
    } catch (error) {
      throw new Error(`Error completing onboarding: ${error.message}`);
    }
  }

  /**
   * Get all onboarding status with pagination
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} Onboarding status data
   */
  async getAllOnboardingStatus(query = {}) {
    try {
      const { status, page = 1, limit = 10 } = query;

      const filterQuery = {};
      if (status) {
        filterQuery.status = status;
      }

      const skip = (page - 1) * limit;

      const [onboardings, total] = await Promise.all([
        Onboarding.find(filterQuery)
          .populate("employeeId", "fullName email designation department")
          .populate("createdBy", "fullName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Onboarding.countDocuments(filterQuery),
      ]);

      // Get status counts
      const statusCounts = await Onboarding.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts = statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        onboardings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        statusCounts: counts,
      };
    } catch (error) {
      throw new Error(`Error getting onboarding status: ${error.message}`);
    }
  }

  /**
   * Revoke onboarding
   * @param {string} onboardingId - Onboarding ID
   * @param {string} reason - Reason for revocation
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} Result of revoking onboarding
   */
  async revokeOnboarding(onboardingId, reason, adminId) {
    try {
      const onboarding = await Onboarding.findById(onboardingId);

      if (!onboarding) {
        throw new Error("Onboarding not found");
      }

      // Can only revoke if status is pending or accepted
      if (!["pending", "accepted"].includes(onboarding.status)) {
        throw new Error(`Cannot revoke onboarding with status: ${onboarding.status}`);
      }

      // Update onboarding
      onboarding.status = "revoked";
      onboarding.revokedAt = new Date();
      onboarding.revokedBy = adminId; // From auth middleware
      onboarding.revocationReason = reason || "No reason provided";
      await onboarding.save();

      // Deactivate employee account
      await User.findByIdAndUpdate(onboarding.employeeId, { isActive: false });

      return {
        success: true,
        message: "Onboarding revoked successfully"
      };
    } catch (error) {
      throw new Error(`Error revoking onboarding: ${error.message}`);
    }
  }

  /**
   * Resend offer letter
   * @param {string} onboardingId - Onboarding ID
   * @returns {Promise<Object>} Result of resending offer letter
   */
  async resendOfferLetter(onboardingId) {
    try {
      const onboarding = await Onboarding.findById(onboardingId);

      if (!onboarding) {
        throw new Error("Onboarding not found");
      }

      // Can only resend if status is pending
      if (onboarding.status !== "pending") {
        throw new Error("Can only resend offer letters with pending status");
      }

      // Check if expired - generate new token if needed
      if (onboarding.isExpired()) {
        const plainToken = onboarding.generateToken();
        await onboarding.save();

        return {
          success: true,
          message: "New offer letter sent successfully with extended validity",
          token: plainToken
        };
      }

      // Generate plain token from hashed token
      const plainToken = onboarding.generateToken();
      await onboarding.save();

      return {
        success: true,
        message: "Offer letter resent successfully",
        token: plainToken
      };
    } catch (error) {
      throw new Error(`Error resending offer letter: ${error.message}`);
    }
  }
}

export default new OnboardingService();
