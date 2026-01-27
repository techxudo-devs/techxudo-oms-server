import mongoose from "mongoose";
import dotenv from "dotenv";
import EmploymentFormService from "./services/employment/employmentFormService.js";
import EmploymentForm from "./models/employment/EmploymentForm.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. Create a dummy form
    const formData = {
      organizationId: new mongoose.Types.ObjectId(), // Dummy ID
      appointmentLetterId: new mongoose.Types.ObjectId(), // Dummy ID
      employeeEmail: "test@example.com",
      personalInfo: { legalName: "Test User" },
      contactInfo: { email: "test@example.com" },
      status: "draft",
    };

    console.log("Creating form...");
    // Mock email service to avoid sending real email
    const emailService = (await import("./services/email/emailService.js")).default;
    emailService.sendEmploymentFormEmail = async () => console.log("Mock email sent");

    const { form, token } = await EmploymentFormService.createEmploymentForm(formData);
    console.log("Form created with ID:", form._id);
    console.log("Unhashed Token:", token);
    console.log("Stored Submission Token:", form.submissionToken);
    console.log("Stored Hashed Token:", form.token);

    // 2. Verify findByToken (GET view)
    console.log("Verifying findByToken...");
    const foundByToken = await EmploymentForm.findByToken(token);
    if (foundByToken) {
      console.log("SUCCESS: Found by hashed token");
    } else {
      console.error("FAILURE: Not found by hashed token");
    }

    // 3. Verify submissionToken lookup (POST submit)
    console.log("Verifying submissionToken lookup...");
    const foundBySubmissionToken = await EmploymentForm.findOne({ submissionToken: token });
    if (foundBySubmissionToken) {
      console.log("SUCCESS: Found by submissionToken");
    } else {
      console.error("FAILURE: Not found by submissionToken");
    }

    // Cleanup
    await EmploymentForm.findByIdAndDelete(form._id);
    console.log("Cleanup done");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
