import express from "express";
import { createTemplate, getTemplates, getTemplateById, updateTemplate, deleteTemplate } from "../controllers/documents/templateController.js";
import { previewBrandedTemplate, generateBrandedTemplate, createEditableFromBranded } from "../controllers/documents/brandedTemplateController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";
import { body } from "express-validator";
import { organizationContext } from "../middlewares/organizationContext.js";

const router = express.Router();

// Branded templates: preview (HTML) and generate (PDF to Cloudinary)
// Put these BEFORE parameterized routes to avoid ":id" catching "preview"/"generate"
router.get(
  "/preview",
  authMiddleware,
  isAdmin,
  organizationContext,
  previewBrandedTemplate
);

router.post(
  "/generate",
  authMiddleware,
  isAdmin,
  organizationContext,
  generateBrandedTemplate
);

router.post(
  "/create-from-branded",
  authMiddleware,
  isAdmin,
  organizationContext,
  createEditableFromBranded
);

// Create document template
router
  .route("/")
  .post(
    authMiddleware,
    isAdmin,
    [
      body("name").notEmpty().withMessage("Template name is required"),
      body("type").notEmpty().withMessage("Template type is required"),
      body("content").notEmpty().withMessage("Template content is required"),
    ],
    createTemplate
  )
  .get(authMiddleware, isAdmin, getTemplates); // Only admins can see templates

// Template by ID routes (after specific routes)
router
  .route("/:id")
  .get(authMiddleware, isAdmin, getTemplateById)
  .put(
    authMiddleware,
    isAdmin,
    [
      body("name").optional().notEmpty(),
      body("type").optional().isIn(["contract", "nda", "undertaking"]),
      body("content").optional().notEmpty(),
    ],
    updateTemplate
  )
  .delete(authMiddleware, isAdmin, deleteTemplate);

export default router;
