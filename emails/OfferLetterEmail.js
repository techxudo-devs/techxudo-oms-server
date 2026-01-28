import React from "react";
import { Section, Text, Button } from "@react-email/components";
import BrandEmailLayout from "./components/BrandEmailLayout.js";

const OfferLetterEmail = ({ offerData, token, frontendUrl, org }) => {
  const {
    fullName,
    designation,
    department,
    salary,
    joiningDate
  } = offerData;

  const onboardingUrl = `${frontendUrl}/onboarding/${token}`;

  const formattedSalary = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0
  }).format(salary);

  const formattedDate = new Date(joiningDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return React.createElement(BrandEmailLayout, { org, preview: `Offer Letter - ${designation} Position` },
    // Congratulations Banner
    React.createElement(Section, { style: banner },
      React.createElement(Text, { style: bannerTitle },
        `Congratulations, ${fullName}! 🎉`
      ),
      React.createElement(Text, { style: bannerSubtitle }, `We're excited to offer you a position at ${org?.companyName || "our company"}`)
    ),

    // Main Content
    React.createElement(Section, { style: content },
      React.createElement(Text, { style: greeting },
        "Dear ",
        React.createElement("strong", null, fullName),
        ","
      ),

      React.createElement(Text, { style: paragraph },
        "We are pleased to extend this offer of employment to you. After careful consideration, we believe you will be an excellent addition to our team."
      ),

      // Offer Details Cards
      React.createElement(Section, { style: detailsContainer },
        React.createElement(Section, { style: detailCard },
          React.createElement(Text, { style: detailLabel }, "Position"),
          React.createElement(Text, { style: detailValue }, designation)
        ),

        React.createElement(Section, { style: detailCard },
          React.createElement(Text, { style: detailLabel }, "Department"),
          React.createElement(Text, { style: detailValue }, department || "To be assigned")
        ),

        React.createElement(Section, { style: detailCard },
          React.createElement(Text, { style: detailLabel }, "Compensation"),
          React.createElement(Text, { style: detailValue }, `${formattedSalary} per month`)
        ),

        React.createElement(Section, { style: detailCard },
          React.createElement(Text, { style: detailLabel }, "Joining Date"),
          React.createElement(Text, { style: detailValue }, formattedDate)
        )
      ),

      // CTA Button
      React.createElement(Section, { style: buttonContainer },
        React.createElement(Button, { href: onboardingUrl, style: button },
          "Review Your Offer Letter"
        )
      ),

      // Next Steps
      React.createElement(Section, { style: infoBox },
        React.createElement(Text, { style: infoTitle }, "Next Steps:"),
        React.createElement(Text, { style: listItem }, "1. Review your offer letter details"),
        React.createElement(Text, { style: listItem }, "2. Accept or decline the offer"),
        React.createElement(Text, { style: listItem }, "3. If accepted, complete your profile setup"),
        React.createElement(Text, { style: listItem }, "4. Upload your CNIC and profile picture"),
        React.createElement(Text, { style: listItem }, "5. Provide your professional links (GitHub or LinkedIn)")
      ),

      // Important Notice
      React.createElement(Section, { style: warningBox },
        React.createElement(Text, { style: warningText },
          React.createElement("strong", null, "⏰ Important:"),
          " This offer link will expire in ",
          React.createElement("strong", null, "7 days"),
          ". Please respond at your earliest convenience."
        )
      ),

      React.createElement(Text, { style: paragraph },
        "If you have any questions, please don't hesitate to contact us."
      ),

      React.createElement(Text, { style: paragraph },
        "We look forward to hearing from you!"
      ),

      React.createElement(Text, { style: signature },
        "Best regards,",
        React.createElement("br"),
        React.createElement("strong", null, `${org?.companyName || "Our Company"} HR Team`)
      )
    )
  );
};

// Styles
const banner = {
  backgroundColor: "#f8f9fa",
  padding: "30px",
  textAlign: "center",
  borderBottom: "3px solid #667eea"
};

const bannerTitle = {
  margin: 0,
  color: "#2d3748",
  fontSize: "28px",
  fontWeight: "700"
};

const bannerSubtitle = {
  margin: "10px 0 0 0",
  color: "#4a5568",
  fontSize: "16px"
};

const content = {
  padding: "40px 30px"
};

const greeting = {
  margin: "0 0 20px 0",
  color: "#2d3748",
  fontSize: "16px",
  lineHeight: "1.6"
};

const paragraph = {
  margin: "0 0 20px 0",
  color: "#4a5568",
  fontSize: "15px",
  lineHeight: "1.7"
};

const detailsContainer = {
  margin: "30px 0"
};

const detailCard = {
  padding: "15px",
  backgroundColor: "#f8f9fa",
  borderLeft: "4px solid #667eea",
  marginBottom: "10px",
  borderRadius: "4px"
};

const detailLabel = {
  margin: 0,
  color: "#718096",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "600"
};

const detailValue = {
  margin: "5px 0 0 0",
  color: "#2d3748",
  fontSize: "18px",
  fontWeight: "600"
};

const buttonContainer = {
  margin: "40px 0",
  textAlign: "center"
};

const button = {
  display: "inline-block",
  padding: "16px 48px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
};

const infoBox = {
  backgroundColor: "#edf2f7",
  padding: "20px",
  borderRadius: "6px",
  margin: "30px 0"
};

const infoTitle = {
  margin: "0 0 15px 0",
  color: "#2d3748",
  fontSize: "18px",
  fontWeight: "600"
};

const listItem = {
  margin: "0 0 8px 0",
  color: "#4a5568",
  fontSize: "14px",
  lineHeight: "1.8"
};

const warningBox = {
  backgroundColor: "#fff5f5",
  borderLeft: "4px solid #fc8181",
  padding: "15px",
  margin: "30px 0",
  borderRadius: "4px"
};

const warningText = {
  margin: 0,
  color: "#742a2a",
  fontSize: "14px",
  lineHeight: "1.6"
};

const signature = {
  margin: "30px 0 0 0",
  color: "#2d3748",
  fontSize: "15px",
  lineHeight: "1.8"
};

export default OfferLetterEmail;
