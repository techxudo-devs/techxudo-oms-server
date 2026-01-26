import React from "react";
import { Section, Text } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

export default function ScreeningInviteEmail({ org, candidate, subject, message, jobTitle }) {
  const title = subject || `Interview Screening Invitation${jobTitle ? ` - ${jobTitle}` : ''}`;
  return React.createElement(
    BrandEmailLayout,
    { org },
    React.createElement(
      Section,
      { style: styles.section },
      React.createElement(Text, { style: styles.title }, title),
      candidate?.name
        ? React.createElement(Text, { style: styles.text }, `Hi ${candidate.name},`)
        : null,
      React.createElement(Text, { style: styles.text }, message)
    )
  );
}

const styles = {
  section: { padding: 24 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  text: { fontSize: 14, color: "#374151", lineHeight: 1.7 },
};
