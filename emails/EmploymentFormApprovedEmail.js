import React from "react";
import { Section, Text, Button } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

const EmploymentFormApprovedEmail = ({
  employeeName = "Candidate",
  org,
  portalUrl = "http://localhost:5173/login",
  notes = "",
}) => {
  const company = org?.companyName || "Our Company";

  return React.createElement(
    BrandEmailLayout,
    { org, preview: "Employment form approved" },
    React.createElement(
      Section,
      { style: styles.section },
      React.createElement(Text, { style: styles.title }, "Employment Form Approved"),
      React.createElement(Text, { style: styles.text }, "Dear ", employeeName, ","),
      React.createElement(
        Text,
        { style: styles.text },
        "Your employment form has been reviewed and approved. Here’s what happens next:"
      ),
      React.createElement(Text, { style: styles.text }, "• HR sends you the appointment link to confirm the role and start date."),
      React.createElement(Text, { style: styles.text }, "• You receive the contract for review and e-signature when ready."),
      React.createElement(Text, { style: styles.text }, "• Credentials and onboarding instructions follow once the contract is signed."),
      notes
        ? React.createElement(Text, { style: styles.note }, `HR notes: ${notes}`)
        : null,
      React.createElement(
        Section,
        { style: styles.buttonWrap },
        React.createElement(Button, { href: portalUrl, style: styles.button }, "Access Candidate Portal")
      ),
      React.createElement(
        Text,
        { style: styles.text },
        "If you have any questions, reply to this email and our team will assist you."
      ),
      React.createElement(
        Text,
        { style: styles.text },
        "Best regards,",
        React.createElement("br"),
        `${company} HR Team`
      )
    )
  );
};

const styles = {
  section: { padding: 24 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  text: { fontSize: 14, color: "#374151", lineHeight: 1.7 },
  note: { fontSize: 13, color: "#b45309", marginTop: 8 },
  buttonWrap: { textAlign: "center", margin: "24px 0" },
  button: {
    backgroundColor: "#111827",
    color: "#fff",
    borderRadius: 8,
    padding: "12px 20px",
    textDecoration: "none",
    display: "inline-block",
  },
};

export default EmploymentFormApprovedEmail;
