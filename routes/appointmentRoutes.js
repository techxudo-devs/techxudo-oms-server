import express from "express";
import * as appointmentLetterController from "../controllers/appointmentLetterController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin routes (protected)
router.post(
  "/",
  authMiddleware,
  isAdmin,
  appointmentLetterController.sendAppointmentLetter
);

router.get(
  "/",
  authMiddleware,
  isAdmin,
  appointmentLetterController.getAppointmentLetters
);

router.get(
  "/:id",
  authMiddleware,
  isAdmin,
  appointmentLetterController.getAppointmentLetter
);

// Public routes (token-based access, no auth required)
router.get("/view/:token", appointmentLetterController.markAsViewed);

router.post(
  "/respond/:token",
  appointmentLetterController.respondToAppointmentLetter
);

export default router;
