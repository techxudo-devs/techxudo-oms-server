import Organization from "../models/Organization.js";

const orgCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export const organizationContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    const organizationId = req.user.organizationId;

    if (req.user.role === "superadmin") {
      return next();
    }
    if (!organizationId) {
      return res.status(404).json({
        success: false,
        message: "No organization associated with this user",
      });
    }

    //Check cache first
    const cacheKey = `org_${organizationId}`;
    const cached = orgCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.organization = cached.data;
      return next();
    }

    const organization = await Organization.findById(organizationId)
      .select("-__v")
      .lean();
    if (!organization) {
      return res.status(404).json({
        status: false,
        message: "Organization not found",
      });
    }

    // Skip the inactive check or check a different field if one exists
    // The original code was checking a field that doesn't exist in the schema
    // Assuming organizations are active by default unless specifically marked otherwise

    if (organization.subscription.status === "expired") {
      return res.status(402).json({
        success: false,
        message: "Subscription expired please renew it",
      });
    }

    if (organization.subscription.status === "cancelled") {
      return res.status(403).json({
        success: false,
        message: "Subscription cancelled. Please reactivate to continue",
      });
    }

    orgCache.set(cacheKey, {
      data: organization,
      timestamp: Date.now(),
    });

    req.organization = organization;
    next();
  } catch (error) {
    console.log("Organization context error", error);
    res.status(500).json({
      success: false,
      message: "Failed to load organization context",
    });
  }
};

export const checkUserLimit = async (req, res, next) => {
  try {
    if (!req.organization) {
      return res.status(403).json({
        success: false,
        message: "Organization context required",
      });
    }
    const org = await Organization.findById(req.organization._id);

    if (org.hasReachedUserLimit()) {
      return res.status(403).json({
        success: false,
        message: `User limit reached. Your plan allows ${org.subscription.userLimit} Please Upgrade`,
        currentUser: org.totalEmployees,
        maxUsers: org.subscription.userLimit,
      });
    }

    next();
  } catch (error) {
    console.log("User limit check error", error);
    res.status(500).json({
      success: false,
      message: "Failed to check the user limit",
    });
  }
};

export const clearOrganizationCache = (organizationId) => {
  const cacheKey = `org_${organizationId}`;
  orgCache.delete(cacheKey);
};

export const extractSubDomain = async (req, res, next) => {
  try {
    const host = req.get("host");
    const subdomain = host.split(".")[0];

    if (subdomain === "www" || subdomain === "localhost" || !subdomain)
      return next();

    //find organization by slug
    const organization = await Organization.findOne({ slug: subdomain })
      .select("-__v")
      .lean();

    if (organization) {
      ((req.organizationSlug = subdomain),
        (req.organizationId = organization._id));
    }

    next();
  } catch (error) {
    console.error("Subdoamin extraction error:", error);
    next();
  }
};
