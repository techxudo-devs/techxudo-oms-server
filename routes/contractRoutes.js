import express from "express";
import {
  getContracts,
  getContractById,
  getContractByToken,
  sendContract,
  createContract,
  signContract,
} from "../controllers/employement/ContractController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin routes (protected)
router.post("/", authMiddleware, isAdmin, createContract);
router.get("/", authMiddleware, isAdmin, getContracts);
router.get("/:id", authMiddleware, isAdmin, getContractById);
router.post("/:id/send", authMiddleware, isAdmin, sendContract);

// Public routes (token-based access, no auth required)
router.get("/view/:token", getContractByToken);
router.post("/sign/:token", signContract);

export default router;
