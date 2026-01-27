import Application from "../../models/hiring/Application.js";
import emailService from "../email/emailService.js";
class HiringEmailService {

  async sendAcknowledgement(applicationId) {
    const application = await Application.findById(applicationId)
      .populate("candidateId")
      .populate("organizationId");

    if (!application) return;

    const candidate = application.candidateId;
    const org = application.organizationId || {};

    const subject = `Application Received - ${application.positionTitle}`;
    try {
      await emailService.sendCandidateAcknowledgement(
        org,
        candidate,
        application.positionTitle,
        application.department,
      );
    } catch (e) {
      console.error("sendAcknowledgement email error:", e.message);
    }

    application.emailsSent.push({ type: "acknowledgement", sentAt: new Date(), subject });
    await application.save();
  }

  async sendScreeningInvite(applicationId, subjectOverride = null, messageOverride = null) {
    const application = await Application.findById(applicationId)
      .populate("candidateId")
      .populate("organizationId");
    if (!application) return;
    const candidate = application.candidateId;
    const org = application.organizationId || {};
    const subject = subjectOverride || `Screening Invitation - ${application.positionTitle}`;
    try {
      await emailService.sendScreeningInvite(
        org,
        candidate.email,
        subjectOverride,
        messageOverride,
        candidate,
        application.positionTitle,
      );
    } catch (e) {
      console.error("sendScreeningInvite email error:", e.message);
    }
    application.emailsSent.push({ type: "screening", sentAt: new Date(), subject });
    await application.save();
  }

  async sendInterviewInvite(applicationId, interview, subjectOverride = null, messageOverride = "") {
    const application = await Application.findById(applicationId)
      .populate("candidateId")
      .populate("organizationId");
    if (!application) return;
    const candidate = application.candidateId;
    const org = application.organizationId || {};
    const subject = subjectOverride || `Interview Invitation - ${application.positionTitle}`;
    try {
      await emailService.sendInterviewInvite(org, candidate, application, interview, subjectOverride, messageOverride);
    } catch (e) {
      console.error("sendInterviewInvite email error:", e.message);
    }
    application.emailsSent.push({ type: "interview", sentAt: new Date(), subject });
    await application.save();
  }

  async sendRejection(applicationId, reason = "") {
    const application = await Application.findById(applicationId)
      .populate("candidateId")
      .populate("organizationId");
    if (!application) return;
    const candidate = application.candidateId;
    const org = application.organizationId || {};
    const subject = `Application Update - ${application.positionTitle}`;
    try {
      await emailService.sendRejectionEmail(
        org,
        candidate,
        application.positionTitle,
        reason,
      );
    } catch (e) {
      console.error("sendRejection email error:", e.message);
    }
    application.emailsSent.push({ type: "rejection", sentAt: new Date(), subject });
    await application.save();
  }
}

const hiringEmailService = new HiringEmailService();
export default hiringEmailService;
