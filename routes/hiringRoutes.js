import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { organizationContext } from "../middlewares/organizationContext.js";
import { listApplications, createCandidate, moveStage, sendApplicationEmail } from "../controllers/hiring/hiringController.js";

const router = express.Router();

router.use(protect);
router.use(organizationContext);

router.get("/applications", listApplications);
router.post("/candidates", createCandidate);
router.post("/applications/:id/move", moveStage);
router.post("/applications/:id/email", sendApplicationEmail);

export default router;

