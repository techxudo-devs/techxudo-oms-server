import React from "react";
import { Section, Text } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

export default function InterviewInviteEmail({ org, candidate, application, interview, message }) {
  const name = candidate?.name ? `Hi ${candidate.name},` : "Hi,";
  const title = application?.positionTitle ? `Interview for ${application.positionTitle}` : "Interview Invitation";
  const dt = interview?.scheduledAt ? new Date(interview.scheduledAt) : null;
  const when = dt
    ? dt.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const duration = interview?.duration ? `${interview.duration} minutes` : null;
  return React.createElement(
    BrandEmailLayout,
    { org },
    React.createElement(
      Section,
      { style: styles.section },
      React.createElement(Text, { style: styles.title }, title),
      React.createElement(Text, { style: styles.text }, name),
      React.createElement(Text, { style: styles.lead }, "We’re excited to move you forward to the next step in our hiring process. Here are your interview details:"),
      React.createElement(
        'div',
        { style: styles.detailsBox },
        when ? React.createElement(Text, { style: styles.detail }, `When: ${when}`) : null,
        duration ? React.createElement(Text, { style: styles.detail }, `Duration: ${duration}`) : null,
        interview?.meetingLink
          ? React.createElement(Text, { style: styles.detail }, `Meeting Link: ${interview.meetingLink}`)
          : null,
        interview?.location
          ? React.createElement(Text, { style: styles.detail }, `Location: ${interview.location}`)
          : null,
      ),
      message ? React.createElement(Text, { style: styles.text }, message) : null,
      React.createElement(Text, { style: styles.text }, "If the time doesn’t work, reply with your availability for the next 2–3 days and we’ll be happy to reschedule."),
      React.createElement(Text, { style: styles.text }, `Best regards,\n${org?.companyName ? org.companyName + " Hiring Team" : "Hiring Team"}`)
    )
  );
}

const styles = {
  section: { padding: 24 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  text: { fontSize: 14, color: "#374151", lineHeight: 1.7 },
  lead: { fontSize: 14, color: "#111827", lineHeight: 1.7, marginTop: 6 },
  detailsBox: { backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, margin: '10px 0 8px' },
  detail: { fontSize: 14, color: '#111827', lineHeight: 1.7, margin: '2px 0' },
};
