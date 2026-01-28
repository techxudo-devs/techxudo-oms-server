import express from "express";
import * as onboardingController from "../controllers/onboardingController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin only routes (must be before token routes to avoid conflicts)
router.post(
  "/create-employee",
  authMiddleware,
  isAdmin,
  onboardingController.createEmployee
);
router.get(
  "/admin/status",
  authMiddleware,
  isAdmin,
  onboardingController.getAllOnboardingStatus
);
router.post(
  "/:id/revoke",
  authMiddleware,
  isAdmin,
  onboardingController.revokeOnboarding
);
router.post(
  "/:id/resend",
  authMiddleware,
  isAdmin,
  onboardingController.resendOfferLetter
);

// Public routes (token-based access)
router.get("/:token", onboardingController.getOnboardingDetails);
router.post("/:token/accept", onboardingController.acceptOffer);
router.post("/:token/reject", onboardingController.rejectOffer);
router.post("/:token/complete", onboardingController.completeOnboarding);
router.post("/:token/employment-form", onboardingController.ensureEmploymentForm);

export default router;
