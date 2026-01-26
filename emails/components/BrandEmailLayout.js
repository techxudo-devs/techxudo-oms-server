import React from "react";
import { Html, Head, Body, Container, Section, Img, Text, Hr } from "@react-email/components";

// Branding-aware email layout that adapts to organization logo and theme colors
export default function BrandEmailLayout({ org = {}, children, preview }) {
  const primary = org?.theme?.primaryColor || "#111827";
  const accent = org?.theme?.accentColor || "#3B82F6";
  const company = org?.companyName || "Your Company";
  const logo = org?.logo || null;

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Body,
      { style: styles.body },
      React.createElement(
        Container,
        { style: styles.container },
        React.createElement(
          Section,
          { style: { ...styles.header, background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` } },
          logo
            ? React.createElement(Img, { src: logo, alt: company, width: 56, height: 56, style: styles.logo })
            : null,
          React.createElement(Text, { style: styles.headerTitle }, company),
          React.createElement(Text, { style: styles.headerSubtitle }, "Hiring & Onboarding")
        ),
        children,
        React.createElement(
          Section,
          { style: styles.footer },
          React.createElement(Hr, { style: styles.footerDivider }),
          React.createElement(
            Text,
            { style: styles.footerText },
            `© ${new Date().getFullYear()} ${company}. All rights reserved.`
          ),
          React.createElement(
            Text,
            { style: styles.footerSubtext },
            "This is an automated email. Please do not reply."
          )
        )
      )
    )
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f8fb",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  container: {
    margin: "40px auto",
    width: "600px",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  header: {
    padding: "28px 24px",
    textAlign: "center",
    color: "#fff",
  },
  logo: {
    borderRadius: 12,
    display: "block",
    margin: "0 auto 10px auto",
  },
  headerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
  },
  headerSubtitle: {
    margin: "6px 0 0 0",
    opacity: 0.85,
    fontSize: 12,
  },
  footer: {
    padding: 20,
    textAlign: "center",
  },
  footerDivider: {
    borderColor: "#e5e7eb",
    margin: "0 0 12px 0",
  },
  footerText: { color: "#6b7280", fontSize: 12, margin: 0 },
  footerSubtext: { color: "#9ca3af", fontSize: 11, marginTop: 6 },
};
