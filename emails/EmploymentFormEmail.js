import React from "react";
import { Section, Text, Button } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

const EmploymentFormEmail = ({
  employeeName = "Candidate",
  formLink = "http://localhost:5173/employment/form/token",
  org,
}) => {
  return React.createElement(
    BrandEmailLayout,
    { org, preview: "Complete your employment information" },
    React.createElement(
      Section,
      { style: styles.section },
      React.createElement(Text, { style: styles.title }, "Employment Information Form"),
      React.createElement(
        Text,
        { style: styles.text },
        "Dear ",
        employeeName,
        ","
      ),
      React.createElement(
        Text,
        { style: styles.text },
        `To proceed with your onboarding at ${org?.companyName || "our company"}, please complete your employment information form. This helps us set up your HR records.`
      ),
      React.createElement(
        Section,
        { style: styles.buttonWrap },
        React.createElement(Button, { href: formLink, style: styles.button }, "Complete Form")
      ),
      React.createElement(
        Text,
        { style: styles.text },
        "Please complete this form within 7 days."
      ),
      React.createElement(
        Text,
        { style: styles.text },
        "Best regards,",
        React.createElement("br"),
        `${org?.companyName || "Our Company"} Team`
      )
    )
  );
};

const styles = {
  section: { padding: 24 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  text: { fontSize: 14, color: "#374151", lineHeight: 1.7 },
  buttonWrap: { textAlign: "center", margin: "20px 0" },
  button: {
    backgroundColor: "#111827",
    color: "#fff",
    borderRadius: 8,
    padding: "12px 18px",
    textDecoration: "none",
    display: "inline-block",
  },
};

export default EmploymentFormEmail;
