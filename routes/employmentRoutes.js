import express from "express";
import * as employmentFormController from "../controllers/employmentFormController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin only routes
router.post(
  "/",
  authMiddleware,
  isAdmin,
  employmentFormController.createEmploymentForm
);

router.get(
  "/",
  authMiddleware,
  isAdmin,
  employmentFormController.getEmploymentForms
);

router.get(
  "/:id",
  authMiddleware,
  isAdmin,
  employmentFormController.getEmploymentForm
);

router.put(
  "/:id/review",
  authMiddleware,
  isAdmin,
  employmentFormController.reviewEmploymentForm
);

router.put(
  "/:id/request-revision",
  authMiddleware,
  isAdmin,
  employmentFormController.requestEmploymentFormRevision
);

// Public routes (to be used with tokens)
router.post(
  "/submit/:token",
  employmentFormController.submitEmploymentForm
);

// Public route for viewing employment form by token
router.get(
  "/view/:token",
  employmentFormController.getEmploymentFormByToken
);

export default router;
