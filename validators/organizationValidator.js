import { body, param, validationResult } from "express-validator";

/**
 * 🛡️ Input Validation Middleware
 * Using express-validator for robust validation
 */

// Validation error handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Register Organization Validation
 */
export const validateRegisterOrganization = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9\s&.-]+$/)
    .withMessage("Company name contains invalid characters"),

  body("ownerName")
    .trim()
    .notEmpty()
    .withMessage("Owner name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Owner name must be between 2 and 50 characters"),

  body("ownerEmail")
    .trim()
    .notEmpty()
    .withMessage("Owner email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("ownerPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),

  body("planSlug")
    .optional()
    .isIn(["free", "startup", "business", "enterprise"])
    .withMessage("Invalid subscription plan"),

  body("industry")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Industry must be less than 50 characters"),

  validate
];

/**
 * Update Organization Validation
 */
export const validateUpdateOrganization = [
  body("companyName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),

  body("logo")
    .optional()
    .isURL()
    .withMessage("Logo must be a valid URL"),

  body("industry")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Industry must be less than 50 characters"),

  body("theme.primaryColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Primary color must be a valid hex color"),

  body("theme.secondaryColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Secondary color must be a valid hex color"),

  body("theme.accentColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Accent color must be a valid hex color"),

  body("theme.darkMode")
    .optional()
    .isBoolean()
    .withMessage("Dark mode must be a boolean"),

  body("address.street")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Street address too long"),

  body("address.city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City name too long"),

  body("address.state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State name too long"),

  body("address.country")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Country name too long"),

  body("address.zipCode")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Zip code too long"),

  body("workingHours.startTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format"),

  body("workingHours.endTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("End time must be in HH:MM format"),

  body("workingHours.workingDays")
    .optional()
    .isArray()
    .withMessage("Working days must be an array")
    .custom((value) => {
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return value.every(day => validDays.includes(day));
    })
    .withMessage("Invalid working day"),

  body("workingHours.timezone")
    .optional()
    .isString()
    .withMessage("Timezone must be a string"),

  body("signatureAuthority.type")
    .optional()
    .isIn(["single", "multiple"])
    .withMessage("Signature type must be 'single' or 'multiple'"),

  body("signatureAuthority.requiredSignatures")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Required signatures must be between 1 and 10"),

  validate
];

/**
 * Department Validation
 */
export const validateAddDepartment = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Department name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must be less than 200 characters"),

  body("headOfDepartment")
    .optional()
    .isMongoId()
    .withMessage("Invalid head of department ID"),

  validate
];

export const validateUpdateDepartment = [
  param("departmentId")
    .isMongoId()
    .withMessage("Invalid department ID"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Department name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must be less than 200 characters"),

  body("headOfDepartment")
    .optional()
    .isMongoId()
    .withMessage("Invalid head of department ID"),

  validate
];

export const validateDeleteDepartment = [
  param("departmentId")
    .isMongoId()
    .withMessage("Invalid department ID"),

  validate
];

/**
 * Policy Validation
 */
export const validateAddPolicy = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Policy title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Policy title must be between 3 and 100 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Policy content is required")
    .isLength({ min: 10, max: 10000 })
    .withMessage("Policy content must be between 10 and 10000 characters"),

  body("isRequired")
    .optional()
    .isBoolean()
    .withMessage("isRequired must be a boolean"),

  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),

  validate
];

export const validateUpdatePolicy = [
  param("policyId")
    .isMongoId()
    .withMessage("Invalid policy ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Policy title must be between 3 and 100 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage("Policy content must be between 10 and 10000 characters"),

  body("isRequired")
    .optional()
    .isBoolean()
    .withMessage("isRequired must be a boolean"),

  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),

  validate
];

export const validateDeletePolicy = [
  param("policyId")
    .isMongoId()
    .withMessage("Invalid policy ID"),

  validate
];

/**
 * Complete Setup Validation
 */
export const validateCompleteSetup = [
  body("companyName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),

  body("logo")
    .optional()
    .isURL()
    .withMessage("Logo must be a valid URL"),

  body("theme")
    .optional()
    .isObject()
    .withMessage("Theme must be an object"),

  body("address")
    .optional()
    .isObject()
    .withMessage("Address must be an object"),

  body("workingHours")
    .optional()
    .isObject()
    .withMessage("Working hours must be an object"),

  body("departments")
    .optional()
    .isArray()
    .withMessage("Departments must be an array"),

  body("documents")
    .optional()
    .isArray()
    .withMessage("Documents must be an array"),
  body("documents.*.name").optional().isString(),
  body("documents.*.url").optional().isString(),

  body("emailSettings")
    .optional()
    .isObject()
    .withMessage("Email settings must be an object"),
  body("emailSettings.fromName").optional().isString(),
  body("emailSettings.fromEmail").optional().isEmail(),
  body("emailSettings.headerColor")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Header color must be a valid hex color"),
  body("emailSettings.templateStyle").optional().isIn(["modern", "minimal"]),

  validate
];
