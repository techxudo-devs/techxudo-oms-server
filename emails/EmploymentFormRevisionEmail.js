import React from "react";
import { Section, Text, Button } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

const EmploymentFormRevisionEmail = ({
  employeeName = "Candidate",
  formLink = "http://localhost:5173/employment/form/token",
  org,
  requestedFields = [],
  notes = "",
}) => {
  return React.createElement(
    BrandEmailLayout,
    { org, preview: "Your employment form needs an update" },
    React.createElement(
      Section,
      { style: { padding: 24 } },
      React.createElement(Text, { style: { fontSize: 18, fontWeight: 700 } }, "Employment Form Update Needed"),
      React.createElement(Text, { style: { fontSize: 14, marginTop: 12, color: "#4b5563" } },
        "Hi ",
        employeeName,
        ",",
      ),
      React.createElement(Text, { style: { fontSize: 14, marginTop: 12, color: "#4b5563" } },
        "Our HR team reviewed your employment form and needs a few clarifications before we can move forward."
      ),
      requestedFields.length > 0 &&
        React.createElement(Section, { style: { marginTop: 16 } },
          React.createElement(Text, { style: { fontSize: 13, fontWeight: 600 } }, "Please revisit these sections:"),
          requestedFields.map((field) =>
            React.createElement(
              Text,
              { key: field, style: { fontSize: 13, color: "#1f2937", marginTop: 4 } },
              `• ${field}`
            ),
          ),
        ),
      notes &&
        React.createElement(Text, { style: { fontSize: 13, marginTop: 12, color: "#1f2937" } },
          `Notes: ${notes}`
        ),
      React.createElement(Section, { style: { marginTop: 20, textAlign: "center" } },
        React.createElement(
          Button,
          { href: formLink, style: { backgroundColor: "#111827", color: "#fff", borderRadius: 6 } },
          "Update Employment Form"
        )
      ),
      React.createElement(Text, { style: { fontSize: 12, marginTop: 16, color: "#9ca3af" } },
        "Once you complete the changes, we will review and share the appointment + contract steps."
      )
    )
  );
};

export default EmploymentFormRevisionEmail;
