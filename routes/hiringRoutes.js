import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { organizationContext } from "../middlewares/organizationContext.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";
import {
  listApplications,
  createCandidate,
  moveStage,
  sendApplicationEmail,
  getApplication,
  addNote,
  scheduleInterview,
  updateInterviewFeedback,
  deleteApplication,
  getHiringStats,
} from "../controllers/hiring/hiringController.js";

const router = express.Router();

router.use(protect);
router.use(organizationContext);

router.get("/applications", listApplications);
router.get("/applications/:id", getApplication);
router.post("/candidates", isAdmin, createCandidate);
router.put("/applications/:id/move", isAdmin, moveStage);
router.post("/applications/:id/email", isAdmin, sendApplicationEmail);
router.post("/applications/:id/notes", addNote);
router.post("/applications/:id/schedule-interview", isAdmin, scheduleInterview);
router.put("/applications/:id/interviews/:interviewId/feedback", isAdmin, updateInterviewFeedback);
router.delete("/applications/:id", isAdmin, deleteApplication);
router.get("/stats", getHiringStats);

export default router;
