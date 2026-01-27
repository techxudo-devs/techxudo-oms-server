import React from "react";
import { Section, Text } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

export default function RejectionEmail({ org, candidate, jobTitle, reason }) {
  const name = candidate?.name ? `Dear ${candidate.name},` : "Dear Candidate,";
  const role = jobTitle ? ` for the ${jobTitle} position` : "";
  return React.createElement(
    BrandEmailLayout,
    { org },
    React.createElement(
      Section,
      { style: styles.section },
      React.createElement(Text, { style: styles.title }, "Application Update"),
      React.createElement(Text, { style: styles.text }, name),
      React.createElement(
        Text,
        { style: styles.text },
        `Thank you for your interest in joining ${org?.companyName || "our company"}${role}.`
      ),
      React.createElement(
        Text,
        { style: styles.text },
        "After careful review of your application, we will not be moving forward at this time."
      ),
      reason ? React.createElement(Text, { style: styles.text }, `Reason: ${reason}`) : null,
      React.createElement(
        Text,
        { style: styles.text },
        "We sincerely appreciate the time you invested. We encourage you to apply again in the future."
      ),
      React.createElement(Text, { style: styles.text }, "We wish you all the best.")
    )
  );
}

const styles = {
  section: { padding: 24 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  text: { fontSize: 14, color: "#374151", lineHeight: 1.7 },
};

