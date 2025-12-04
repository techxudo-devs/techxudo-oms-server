import EmploymentForm from "../../models/employement/EmploymentForm.js";
class EmploymentFormService {
  static async createEmploymentForm(employmentFormData) {
    try {
      const newForm = await EmploymentForm.create(employmentFormData);
      // Generate token after creation
      const token = newForm.generateToken();
      await newForm.save();
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

  static async submitEmploymentForm(formId, employmentFormData) {
    try {
      // This update operation merges the incoming data with the existing document.
      // It assumes the employee submits all the necessary nested fields (personalInfo, cnicInfo, etc.).
      const updatedForm = await EmploymentForm.findByIdAndUpdate(
        formId,
        {
          ...employmentFormData, // Spread the incoming data (includes nested objects)
          status: "submitted",
          submittedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      return updatedForm;
    } catch (error) {
      console.error("Service Error (submitEmploymentForm):", error);
      throw new Error("Failed to submit employment form.");
    }
  }
}

export default EmploymentFormService;
