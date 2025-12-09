import EmploymentForm from "../../models/employement/EmploymentForm.js";
import emailService from "../email/emailService.js";
import crypto from "crypto";
class EmploymentFormService {
  static async createEmploymentForm(employmentFormData) {
    try {
      const newForm = new EmploymentForm(employmentFormData);
      // Generate token after creation
      const token = newForm.generateToken();
      await newForm.save();
      // Send email directly
      await emailService.sendEmploymentFormEmail(
        {
          fullName:
            employmentFormData.personalInfo?.legalName ||
            employmentFormData.employeeName,
          email:
            employmentFormData.contactInfo?.email ||
            employmentFormData.employeeEmail,
        },
        token
      );

      // Return both the form and the unhashed token
      return { form: newForm, token };
    } catch (error) {
      console.error("Service Error (createEmploymentForm):", error);
      throw new Error("Failed to create employment form.");
    }
  }

  static async getEmploymentForms({ filter, page, limit }) {
    try {
      const skip = (page - 1) * limit;

      const forms = await EmploymentForm.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ submittedAt: -1, createdAt: -1 }); // Prioritize sorting by submitted date

      const totalCount = await EmploymentForm.countDocuments(filter);

      return {
        forms,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error("Service Error (getEmploymentForms):", error);
      throw new Error("Failed to fetch employment forms.");
    }
  }

  static async getEmploymentFormById(formId) {
    try {
      const form = await EmploymentForm.findById(formId);
      return form;
    } catch (error) {
      if (error.name === "CastError") {
        return null;
      }
      console.error("Service Error (getEmploymentFormById):", error);
      throw new Error("Failed to fetch employment form by ID.");
    }
  }

  static async getEmploymentFormByToken(token) {
    try {
      console.log("DEBUG: Controller received raw token param:", token);
      const form = await EmploymentForm.findByToken(token);
      return form;
    } catch (error) {
      console.error("Service Error (getEmploymentFormByToken):", error);
      throw new Error("Failed to fetch employment form by token.");
    }
  }

  static async reviewEmploymentForm(formId, status, reviewNotes, reviewerId) {
    try {
      const updateData = {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      };

      const updatedForm = await EmploymentForm.findByIdAndUpdate(
        formId,
        updateData,
        { new: true, runValidators: true }
      );

      return updatedForm;
    } catch (error) {
      console.error("Service Error (reviewEmploymentForm):", error);
      throw new Error("Failed to review employment form.");
    }
  }

  static async submitEmploymentForm(token, employmentFormData) {
    try {
      // Clean and validate token
      const cleanToken = token?.trim();
      if (!cleanToken) {
        console.error("Service Error: No token provided");
        throw new Error("Token is required to submit employment form.");
      }

      console.log(
        "DEBUG: Attempting to find form with token (first 10 chars):",
        cleanToken.substring(0, 10)
      );

      // Find form by token
      const formToUpdate = await EmploymentForm.findByToken(cleanToken);

      if (!formToUpdate) {
        console.error(
          "Service Error: Employment form not found for token (first 10 chars):",
          cleanToken.substring(0, 10)
        );
        return null;
      }

      console.log("DEBUG: Found form with ID:", formToUpdate._id);

      // Check if form is already submitted
      if (formToUpdate.status === "submitted") {
        console.error(
          "Service Error: Form already submitted, ID:",
          formToUpdate._id
        );
        throw new Error("This employment form has already been submitted.");
      }

      // Check if token is expired
      if (formToUpdate.isTokenExpired()) {
        console.error(
          "Service Error: Token expired for form ID:",
          formToUpdate._id
        );
        throw new Error("This employment form link has expired.");
      }

      console.log("DEBUG: Updating form with ID:", formToUpdate._id);

      // Update the form
      const updatedForm = await EmploymentForm.findByIdAndUpdate(
        formToUpdate._id,
        {
          ...employmentFormData,
          status: "pending_review",
          submittedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      console.log("DEBUG: Form successfully updated, ID:", updatedForm._id);
      return updatedForm;
    } catch (error) {
      console.error("Service Error (submitEmploymentForm):", error.message);
      throw error; // Re-throw the original error instead of wrapping it
    }
  }
}

export default EmploymentFormService;
