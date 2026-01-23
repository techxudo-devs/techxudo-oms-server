import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company Name is Required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    logo: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    theme: {
      primaryColor: {
        type: String,
        default: "#fff",
      },
      secondaryColor: {
        type: String,
        default: "#000",
      },
      accentColor: {
        type: String,
        default: "#f1f2f2",
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
    },

    //Company Address
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "" },
      zipCode: { type: String, default: "" },
    },

    workingHours: {
      startTime: { type: String, default: "9:00" },
      endTime: {
        type: String,
        default: "17:00",
      },
      workingDays: [
        {
          type: String,
          default: "",
        },
      ],
      timezone: {
        type: String,
        default: "Asia/Karachi",
      },
    },

    departments: [
      {
        name: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          default: "",
        },
        headOfDepartment: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],

    // Company Documents (uploaded or template references)
    documents: [
      {
        name: { type: String, required: true },
        type: { type: String, default: "upload" }, // upload | template
        url: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    signatureAuthority: {
      authorityType: {
        type: String,
        enum: ["single", "multiple"],
        default: "single",
      },
      requiredSignatures: {
        type: Number,
        default: 1,
        min: 1,
      },
      signatories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    subscription: {
      plan: {
        type: String,
        enum: ["free", "startup", "enterprise", "business"],
      },
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
      },
      userLimit: {
        type: Number,
        default: 5,
      },
      startDate: {
        type: Date,
        default: Date.now(),
      },
      endDate: {
        type: Date,
        default: function () {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date;
        },
      },
      status: {
        type: String,
        enum: ["active", "expired", "cancelled", "suspended"],
        default: "active",
      },
      paymentMethod: {
        type: String,
        default: "",
      },
      billingCycle: {
        type: String,
        default: "",
      },
      stripeCustomerId: {
        type: String,
        default: "",
      },
      stripeSubscription: {
        type: String,
        default: "",
      },
    },

    policies: [
      {
        title: {
          type: String,
          default: "",
        },
        content: {
          type: String,
          default: "",
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Email branding and templates
    emailSettings: {
      fromName: { type: String, default: "" },
      fromEmail: { type: String, default: "" },
      headerColor: { type: String, default: "#000000" },
      footerText: { type: String, default: "" },
      templateStyle: { type: String, enum: ["modern", "minimal"], default: "modern" },
    },
    owner: {
      fullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        default: "",
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      setupComplete: {
        type: Boolean,
        default: false,
      },
      totalEmployees: {
        type: Number,
        default: 0,
      },
    },

    // Top-level setup completion flag
    setupCompleted: {
      type: Boolean,
      default: false,
    },

    // Track total employees at organization level
    totalEmployees: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ slug: 1 });
organizationSchema.index({ "owner.email": 1 });
organizationSchema.index({ "subscription.status": 1 });

organizationSchema.methods.isSubscriptionActive = function () {
  return (
    this.subscription.status === "active" &&
    this.subscription.endDate > new Date()
  );
};

organizationSchema.methods.hasReachedUserLimit = function () {
  return this.totalEmployees >= this.subscription.userLimit;
};

organizationSchema.methods.addDepartment = function (departmentData) {
  this.departments.push(departmentData);
  return this.save();
};

organizationSchema.methods.updateDepartment = function (
  departmentId,
  updateData
) {
  const dept = this.departments.id(departmentId);
  if (dept) {
    Object.assign(dept, updateData);
    return this.save();
  }
  throw new Error("Department Not Found");
};

export default mongoose.model("Organization", organizationSchema);
