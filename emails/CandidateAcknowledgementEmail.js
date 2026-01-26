import React from "react";
import { Section, Text } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

export default function CandidateAcknowledgementEmail({ org, candidate, jobTitle, department }) {
  const nameSuffix = candidate?.name ? `, ${candidate.name}` : '';
  const jobPart = jobTitle ? ` for ${jobTitle}` : '';
  const deptPart = department ? ` in ${department}` : '';
  return React.createElement(
    BrandEmailLayout,
    { org },
    React.createElement(
      Section,
      { style: styles.section },
      React.createElement(Text, { style: styles.title }, `Thanks for applying${nameSuffix}!`),
      React.createElement(
        Text,
        { style: styles.text },
        `We’ve received your application${jobPart}${deptPart}. Our team will review your profile and get back to you soon.`
      ),
      React.createElement(
        Text,
        { style: styles.text },
        "We appreciate your interest and the time you’ve taken to apply."
      )
    )
  );
}

const styles = {
  section: { padding: 24 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  text: { fontSize: 14, color: "#374151", lineHeight: 1.7 },
};
