import Candidate from "../../models/hiring/Candidate.js";
import Application from "../../models/hiring/Application.js";
import ApiResponse from "../../utils/apiResponse.js";
import hiringEmailService from "../../services/hiring/hiringEmailService.js";
import OnboardingService from "../../services/onboarding/onboardingService.js";
import EmailService from "../../services/email/emailService.js";

// GET /api/hiring/applications
export const listApplications = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.organizationId || req.user.organizationId;
    const { stage, department, search, page = 1, limit = 100 } = req.query;

    const filter = { organizationId: orgId };
    if (stage) filter.stage = stage;
    if (department) filter.department = department;

    let applications = await Application.find(filter)
      .populate("candidateId")
      .populate("timeline.movedBy", "fullName")
      .populate("notes.author", "fullName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    if (search) {
      const s = String(search).toLowerCase();
      applications = applications.filter(
        (app) =>
          app.candidateId?.name?.toLowerCase().includes(s) ||
          app.candidateId?.email?.toLowerCase().includes(s) ||
          app.positionTitle?.toLowerCase().includes(s),
      );
    }

    const grouped = {
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    };
    applications.forEach((app) => {
      if (grouped[app.stage]) grouped[app.stage].push(app);
    });

    const total = await Application.countDocuments(filter);
    return res.json(
      ApiResponse.success({ grouped, all: applications, total }, "Applications fetched"),
    );
  } catch (error) {
    console.error("listApplications error:", error);
    return res.status(500).json(ApiResponse.error("Failed to fetch applications", error.message));
  }
};

// POST /api/hiring/candidates
export const createCandidate = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.organizationId || req.user.organizationId;
    const {
      name,
      email,
      phone,
      positionTitle,
      department,
      employmentType = "full-time",
      source = "manual",
      resumeUrl,
      skills = [],
      yearsOfExperience,
    } = req.body;

    let candidate = await Candidate.findOne({ organizationId: orgId, email });
    if (!candidate) {
      candidate = await Candidate.create({
        organizationId: orgId,
        name,
        email,
        phone,
        resumeUrl,
        source,
        skills,
        yearsOfExperience,
      });
    }

    const application = await Application.create({
      organizationId: orgId,
      candidateId: candidate._id,
      positionTitle,
      department,
      employmentType,
      stage: "applied",
      timeline: [
        { stage: "applied", movedBy: req.user._id, notes: "Application created" },
      ],
    });

    await hiringEmailService.sendAcknowledgement(application._id);
    await application.populate("candidateId");

    return res
      .status(201)
      .json(
        ApiResponse.created({ candidate, application }, "Candidate added successfully"),
      );
  } catch (error) {
    console.error("createCandidate error:", error);
    return res
      .status(500)
      .json(ApiResponse.error("Failed to create candidate", error.message));
  }
};

// POST /api/hiring/applications/:id/move
export const moveStage = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.organizationId || req.user.organizationId;
    const { id } = req.params;
    const { stage, notes, salary, joiningDate, currency, phone } = req.body;

    if (!stage) {
      return res.status(400).json(ApiResponse.error("Stage is required"));
    }

    const application = await Application.findOne({ _id: id, organizationId: orgId });
    if (!application) {
      return res.status(404).json(ApiResponse.error("Application not found"));
    }

    const { oldStage, newStage } = await application.moveToStage(stage, req.user._id, notes);

    // If moving to offer, persist offer details when provided
    if (newStage === "offer") {
      application.offer = {
        ...(application.offer || {}),
        salary: typeof salary !== 'undefined' ? Number(salary) : application.offer?.salary,
        currency: currency || application.offer?.currency || "USD",
        joiningDate: joiningDate ? new Date(joiningDate) : application.offer?.joiningDate,
        sentAt: application.offer?.sentAt || new Date(),
        status: application.offer?.status || "pending",
      };
    }

    await application.save();

    if (newStage === "screening") {
      await hiringEmailService.sendScreeningInvite(application._id);
    } else if (newStage === "rejected") {
      await hiringEmailService.sendRejection(application._id, notes);
    } else if (newStage === "offer") {
      try {
        // Ensure candidate data is available
        if (!application.populated("candidateId")) {
          await application.populate("candidateId");
        }
        // Create onboarding + temp employee and send the standard OfferLetterEmail
        const candidateName = application.candidateId?.name || application.candidate?.name || "Candidate";
        const candidateEmail = application.candidateId?.email || application.candidate?.email;
        const result = await OnboardingService.createEmployee(
          {
            fullName: candidateName,
            email: candidateEmail,
            designation: application.positionTitle,
            salary: Number(application.offer?.salary || salary || 0),
            phone: phone || application.candidateId?.phone || "",
            department: application.department || "",
            joiningDate: application.offer?.joiningDate || joiningDate || undefined,
          },
          req.user._id,
        );
        // Link onboarding to application
        application.offer = {
          ...(application.offer || {}),
          onboardingId: result.onboarding.id,
        };
        await application.save();
        // Send offer letter using existing template and token
        await EmailService.sendOfferLetterEmail(
          result.onboarding.offerDetails,
          result.token,
          req.organization || null
        );
      } catch (e) {
        console.error("Offer email/onboarding error:", e);
        const msg = e?.message || String(e);
        // Surface duplicate user error clearly to client
        if (msg.includes('E11000') || msg.toLowerCase().includes('already exists')) {
          return res.status(409).json(
            ApiResponse.error('Failed to initiate offer', msg, 409)
          );
        }
        return res.status(400).json(
          ApiResponse.error('Failed to initiate offer', msg, 400)
        );
      }
    }

    await application.populate("candidateId");
    return res.json(
      ApiResponse.success(application, `Application moved from ${oldStage} to ${newStage}`),
    );
  } catch (error) {
    console.error("moveStage error:", error);
    return res.status(500).json(ApiResponse.error("Failed to move application", error.message));
  }
};

// POST /api/hiring/applications/:id/email
export const sendApplicationEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, reason, interview, subject, message } = req.body || {};

    switch (type) {
      case "acknowledgement":
        await hiringEmailService.sendAcknowledgement(id);
        break;
      case "screening":
        await hiringEmailService.sendScreeningInvite(id, subject, message);
        break;
      case "interview":
        await hiringEmailService.sendInterviewInvite(id, interview);
        break;
      case "rejection":
        await hiringEmailService.sendRejection(id, reason);
        break;
      default:
        return res.status(400).json(ApiResponse.error("Invalid email type"));
    }

    return res.json(ApiResponse.success(null, "Email sent"));
  } catch (error) {
    console.error("sendApplicationEmail error:", error);
    return res.status(500).json(ApiResponse.error("Failed to send email", error.message));
  }
};

// GET /api/hiring/applications/:id
export const getApplication = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.organizationId || req.user.organizationId;
    const { id } = req.params;
    const application = await Application.findOne({ _id: id, organizationId: orgId })
      .populate("candidateId")
      .populate("timeline.movedBy", "fullName email")
      .populate("notes.author", "fullName email")
      .populate("interviews.interviewers", "fullName email");

    if (!application) {
      return res.status(404).json(ApiResponse.error("Application not found"));
    }
    return res.json(ApiResponse.success(application));
  } catch (error) {
    console.error("getApplication error:", error);
    return res.status(500).json(ApiResponse.error("Failed to fetch application", error.message));
  }
};

// POST /api/hiring/applications/:id/notes
export const addNote = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;
    const { content, isPrivate = false } = req.body || {};
    if (!content) {
      return res.status(400).json(ApiResponse.error("Note content is required"));
    }
    const application = await Application.findOne({ _id: id, organizationId: orgId });
    if (!application) {
      return res.status(404).json(ApiResponse.error("Application not found"));
    }
    await application.addNote(req.user._id, content, isPrivate);
    await application.populate("notes.author", "fullName email");
    return res.json(ApiResponse.success(application.notes, "Note added successfully"));
  } catch (error) {
    console.error("addNote error:", error);
    return res.status(500).json(ApiResponse.error("Failed to add note", error.message));
  }
};

// POST /api/hiring/applications/:id/schedule-interview
export const scheduleInterview = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;
    const { scheduledAt, duration = 60, type, interviewers = [], meetingLink, location, subject, message } = req.body || {};
    const application = await Application.findOne({ _id: id, organizationId: orgId });
    if (!application) {
      return res.status(404).json(ApiResponse.error("Application not found"));
    }
    const interview = { scheduledAt, duration, type, interviewers, meetingLink, location, status: "scheduled" };
    await application.scheduleInterview(interview);
    // Send invite (single combined email with details)
    await hiringEmailService.sendInterviewInvite(application._id, interview, subject, message);
    // Ensure stage is interview
    if (application.stage !== "interview") {
      await application.moveToStage("interview", req.user._id, "Interview scheduled");
      await application.save();
    }
    await application.populate("interviews.interviewers", "fullName email");
    return res.json(ApiResponse.success(application, "Interview scheduled successfully"));
  } catch (error) {
    console.error("scheduleInterview error:", error);
    return res.status(500).json(ApiResponse.error("Failed to schedule interview", error.message));
  }
};

// PUT /api/hiring/applications/:id/interviews/:interviewId/feedback
export const updateInterviewFeedback = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id, interviewId } = req.params;
    const { feedback, rating, status } = req.body || {};
    const application = await Application.findOne({ _id: id, organizationId: orgId });
    if (!application) {
      return res.status(404).json(ApiResponse.error("Application not found"));
    }
    const interview = application.interviews.id(interviewId);
    if (!interview) {
      return res.status(404).json(ApiResponse.error("Interview not found"));
    }
    if (typeof feedback !== "undefined") interview.feedback = feedback;
    if (typeof rating !== "undefined") interview.rating = rating;
    if (typeof status !== "undefined") interview.status = status;
    if (status === "completed" && !interview.completedAt) interview.completedAt = new Date();
    await application.save();
    return res.json(ApiResponse.success(interview, "Interview updated"));
  } catch (error) {
    console.error("updateInterviewFeedback error:", error);
    return res.status(500).json(ApiResponse.error("Failed to update interview", error.message));
  }
};

// DELETE /api/hiring/applications/:id
export const deleteApplication = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;
    const application = await Application.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!application) {
      return res.status(404).json(ApiResponse.error("Application not found"));
    }
    return res.json(ApiResponse.success(null, "Application deleted"));
  } catch (error) {
    console.error("deleteApplication error:", error);
    return res.status(500).json(ApiResponse.error("Failed to delete application", error.message));
  }
};

// GET /api/hiring/stats
export const getHiringStats = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const stages = ["applied", "screening", "interview", "offer", "hired", "rejected"];
    const counts = {};
    for (const s of stages) {
      // eslint-disable-next-line no-await-in-loop
      counts[s] = await Application.countDocuments({ organizationId: orgId, stage: s });
    }
    const total = await Application.countDocuments({ organizationId: orgId });
    return res.json(ApiResponse.success({ counts, total }));
  } catch (error) {
    console.error("getHiringStats error:", error);
    return res.status(500).json(ApiResponse.error("Failed to fetch stats", error.message));
  }
};

// DELETE /api/hiring/candidates/:id (Dev only)
export const deleteCandidate = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json(ApiResponse.error("Not allowed in production"));
    }
    const orgId = req.organization?._id || req.organizationId || req.user.organizationId;
    const { id } = req.params;

    const candidate = await Candidate.findOne({ _id: id, organizationId: orgId });
    if (!candidate) {
      return res.status(404).json(ApiResponse.error("Candidate not found"));
    }

    const appDelete = await Application.deleteMany({ organizationId: orgId, candidateId: id });
    await Candidate.deleteOne({ _id: id });

    return res.json(
      ApiResponse.success({ deletedApplications: appDelete.deletedCount || 0 }, "Candidate and related applications deleted"),
    );
  } catch (error) {
    console.error("deleteCandidate error:", error);
    return res.status(500).json(ApiResponse.error("Failed to delete candidate", error.message));
  }
};
