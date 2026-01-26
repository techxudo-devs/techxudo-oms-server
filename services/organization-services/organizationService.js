import Organization from "../../models/Organization.js";
import User from "../../models/User.js";
import SubscriptionPlan from "../../models/SubscriptionPlan.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { clearOrganizationCache } from "../../middlewares/organizationContext.js";

class OrganizationService {
  async createOrganization(data) {
    const session = await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        const { companyName, ownerEmail, ownerName, ownerPassword, planSlug } =
          data;

        // Check inside transaction to avoid race conditions
        const existingOrg = await Organization.findOne({ companyName }, null, {
          session,
        });
        if (existingOrg)
          throw new Error("Organization with this name already exists");

        const existingUser = await User.findOne({ email: ownerEmail }, null, {
          session,
        });
        if (existingUser)
          throw new Error("User with this email already exists");

        const plan = await this.getSubscriptionPlan(planSlug || "free");

        const slug = companyName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 50);

        const organization = await Organization.create(
          [
            {
              companyName,
              slug,
              owner: {
                fullName: ownerName,
                email: ownerEmail,
              },
              subscription: {
                plan: plan.slug,
                planId: plan._id,
                userLimit: plan.features.userLimit,
                startDate: new Date(),
                endDate: this.calculateSubscriptionEndDate(
                  plan.slug,
                  "monthly"
                ),
                status: "active",
              },
              setupCompleted: false,
            },
          ],
          { session }
        );

        const org = organization[0];

        const owner = await User.create(
          [
            {
              fullName: ownerName,
              email: ownerEmail,
              passwordHash: ownerPassword,
              role: "admin",
              organizationId: org._id,
              isActive: true,
              isEmailVerified: true,
              onBoardingStatus: {
                isComplete: true,
                credentialsSet: true,
                currentStep: "completed",
              },
            },
          ],
          { session }
        );

        const user = owner[0];

        org.owner.userId = user._id;
        org.totalEmployees = 1;
        await org.save({ session });

        // Prepare final return data
        const token = jwt.sign(
          {
            id: user._id,
            fullName: user.fullName,
            role: user.role,
            email: user.email,
            organizationId: user.organizationId,
            setupCompleted: org.setupCompleted,
            organizationSlug: org.slug,
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        result = {
          organization: org.toObject(),
          owner: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            token,
          },
        };
      });

      return result;
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateOrganization(organizationId, updateData) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    const allowedUpdates = [
      "companyName",
      "logo",
      "industry",
      "theme",
      "address",
      "workingHours",
      "signatureAuthority",
      "emailSettings",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (
          typeof updateData[key] === "object" &&
          !Array.isArray(updateData[key])
        ) {
          organization[key] = { ...organization[key], ...updateData[key] };
        } else {
          organization[key] = updateData[key];
        }
      }
    });

    await organization.save();

    clearOrganizationCache(organizationId);

    return organization;
  }

  async completeSetup(organizationId, setupData) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    if (organization.setupCompleted)
      throw new Error("Organization setup already completed");

    Object.assign(organization, setupData);
    organization.setupCompleted = true;
    organization.isVerified = true;

    await organization.save();
    clearOrganizationCache(organizationId);

    // Generate new token with setupCompleted: true
    const owner = await User.findById(organization.owner.userId);
    const newToken = jwt.sign(
      {
        id: owner._id,
        fullName: owner.fullName,
        role: owner.role,
        email: owner.email,
        organizationId: owner.organizationId,
        setupCompleted: true,
        organizationSlug: organization.slug,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { organization, token: newToken };
  }

  async addDepartment(organizationId, departmentData) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    const exists = organization.departments.some(
      (dept) => dept.name.toLowerCase() === departmentData.name.toLowerCase()
    );

    if (exists) throw new Error("Department with this name is already exists");

    organization.departments.push(departmentData);
    await organization.save();

    clearOrganizationCache(organizationId);

    return organization.departments[organization.departments.length - 1];
  }

  async updateDepartment(organizationId, departmentId, updateData) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    const department = organization.departments.id(departmentId);

    if (!department) throw new Error("department not found");

    Object.assign(department, updateData);
    await organization.save();

    clearOrganizationCache(organizationId);

    return department;
  }

  async deleteDepartment(organizationId, departmentId) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    const userInDept = await User.countDocuments({
      organizationId,
      department: organization.departments.id(departmentId)?.name,
    });
    if (userInDept > 0)
      throw new Error(
        `Cannot delete Department. ${userInDept} employee(s) are assigned to it`
      );
    organization.departments.pull(departmentId);
    await organization.save();

    clearOrganizationCache(organizationId);

    return { success: true };
  }

  async addPolicy(organizationId, policyData) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    const policy = {
      ...policyData,
      order: organization.policies.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    organization.policies.push(policy);
    await organization.save();

    clearOrganizationCache(organizationId);
    return organization.policies[organization.policies.length - 1];
  }

  async updatePolicy(organizationId, policyId, updateData) {
    const organization = await Organization.findById(organizationId);

    if (!organization) throw new Error("Organization not found");

    const policy = organization.policies.id(policyId);

    if (!policy) throw new Error("Policy not found");

    Object.assign(policy, updateData);
    policy.updatedAt = new Date();

    await organization.save();
    clearOrganizationCache(organizationId);
    return policy;
  }

  async deletePolicy(organizationId, policyId) {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new Error("Organization not found");
    }

    organization.policies.pull(policyId);
    await organization.save();

    clearOrganizationCache(organizationId);

    return { success: true };
  }

  async getSubscriptionPlan(slug) {
    const plan = await SubscriptionPlan.findOne({ slug, isActive: true });

    if (!plan) {
      throw new Error(`Subscription plan '${slug}' not found`);
    }

    return plan;
  }

  calculateSubscriptionEndDate(planSlug, billingCycle) {
    const endDate = new Date();

    if (planSlug === "free") {
      endDate.setDate(endDate.getDate() + 30); // 30 days trial
    } else if (billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return endDate;
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId) {
    const [organization, userStats, totalUsers] = await Promise.all([
      Organization.findById(organizationId).lean(),
      User.aggregate([
        { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({ organizationId, isActive: true }),
    ]);

    if (!organization) {
      throw new Error("Organization not found");
    }

    return {
      organization: {
        name: organization.companyName,
        slug: organization.slug,
        setupCompleted: organization.setupCompleted,
      },
      users: {
        total: totalUsers,
        limit: organization.subscription.userLimit,
        remaining: organization.subscription.userLimit - totalUsers,
        byRole: userStats,
      },
      departments: organization.departments.length,
      subscription: {
        plan: organization.subscription.plan,
        status: organization.subscription.status,
        endDate: organization.subscription.endDate,
      },
    };
  }

  /**
   * Check if organization can add more users
   */
  async canAddUser(organizationId) {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (!organization.isSubscriptionActive()) {
      return {
        canAdd: false,
        reason: "Subscription is not active",
      };
    }

    if (organization.hasReachedUserLimit()) {
      return {
        canAdd: false,
        reason: `User limit reached (${organization.subscription.userLimit} users)`,
        currentUsers: organization.totalEmployees,
        limit: organization.subscription.userLimit,
      };
    }

    return { canAdd: true };
  }

  /**
   * Increment user count
   */
  async incrementUserCount(organizationId) {
    await Organization.findByIdAndUpdate(organizationId, {
      $inc: { totalEmployees: 1 },
    });
    clearOrganizationCache(organizationId);
  }

  /**
   * Decrement user count
   */
  async decrementUserCount(organizationId) {
    await Organization.findByIdAndUpdate(organizationId, {
      $inc: { totalEmployees: -1 },
    });
    clearOrganizationCache(organizationId);
  }
}

export default new OrganizationService();
