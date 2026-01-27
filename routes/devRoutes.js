import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import Onboarding from "../models/Onboarding.js";
import Candidate from "../models/hiring/Candidate.js";
import Application from "../models/hiring/Application.js";

const router = express.Router();

router.use(protect);

// Dev-only route to delete a user by email and clean related onboarding within same org
router.delete("/user-by-email", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, message: "Not allowed in production" });
  }
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Delete onboarding(s) tied to this user
    const ob = await Onboarding.deleteMany({ employeeId: user._id });

    // Optionally also delete candidate+applications with same email in this org (use carefully)
    const candidate = await Candidate.findOne({ organizationId: user.organizationId, email });
    let appDeleted = 0;
    if (candidate) {
      const delRes = await Application.deleteMany({ organizationId: user.organizationId, candidateId: candidate._id });
      appDeleted = delRes.deletedCount || 0;
      await Candidate.deleteOne({ _id: candidate._id });
    }

    await User.deleteOne({ _id: user._id });

    return res.json({
      success: true,
      message: "User and related records deleted",
      data: {
        onboardingDeleted: ob.deletedCount || 0,
        candidateDeleted: !!candidate,
        applicationsDeleted: appDeleted,
      },
    });
  } catch (error) {
    console.error("dev delete user error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete user" });
  }
});

export default router;

