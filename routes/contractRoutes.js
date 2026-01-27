import express from "express";
// Updated path after renaming 'employement' -> 'employment'
import {
  getContracts as _getContracts,
  getContractById as _getContractById,
  getContractByToken as _getContractByToken,
  sendContract as _sendContract,
  createContract as _createContract,
  signContract as _signContract,
} from "../controllers/employment/ContractController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin routes (protected)
router.post("/", authMiddleware, isAdmin, _createContract);
router.get("/", authMiddleware, isAdmin, _getContracts);
router.get("/:id", authMiddleware, isAdmin, _getContractById);
router.post("/:id/send", authMiddleware, isAdmin, _sendContract);

// Public routes (token-based access, no auth required)
router.get("/view/:token", _getContractByToken);
router.post("/sign/:token", _signContract);

export default router;
