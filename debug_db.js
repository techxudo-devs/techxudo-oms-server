import mongoose from "mongoose";
import dotenv from "dotenv";
import EmploymentForm from "./models/employment/EmploymentForm.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    // Create a test form
    const testForm = new EmploymentForm({
      organizationId: new mongoose.Types.ObjectId(),
      appointmentLetterId: new mongoose.Types.ObjectId(),
      employeeEmail: "debug@test.com",
      contactInfo: { email: "debug@test.com" },
      status: "draft",
    });
    testForm.generateToken();
    await testForm.save();
    console.log("Created test form:", testForm._id);

    const forms = await EmploymentForm.find().sort({ createdAt: -1 }).limit(5);
    console.log(`Found ${forms.length} forms`);
    
    // Cleanup
    await EmploymentForm.deleteMany({ employeeEmail: "debug@test.com" });
    console.log("Cleanup done");

    const AppointmentLetter = (await import("./models/employment/AppointmentLetter.js")).default;
    const appointments = await AppointmentLetter.countDocuments();
    console.log(`Found ${appointments} appointments`);

    forms.forEach((form, index) => {
      console.log(`\n--- Form ${index + 1} ---`);
      console.log("ID:", form._id);
      console.log("Email:", form.employeeEmail);
      console.log("Status:", form.status);
      console.log("Created At:", form.createdAt);
      console.log("Submission Token:", form.submissionToken);
      console.log("Hashed Token (exists):", !!form.token);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
