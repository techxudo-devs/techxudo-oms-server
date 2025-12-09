import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";
import * as React from "react";

const ContractEmail = ({
  employeeName = "Employee",
  position = "Position",
  department = "Department",
  startDate = "TBD",
  baseSalary = 0,
  signingLink = "http://localhost:5173/employment/contract/token",
}) => {
  const formattedSalary = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(baseSalary);

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Preview,
      null,
      "Your employment contract is ready for signing"
    ),
    React.createElement(
      Tailwind,
      null,
      React.createElement(
        Body,
        { className: "bg-white my-auto mx-auto font-sans" },
        React.createElement(
          Container,
          {
            className:
              "border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]",
          },
          React.createElement(
            Heading,
            {
              className:
                "text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0",
            },
            "📄 Employment Contract Ready"
          ),
          React.createElement(
            Text,
            { className: "text-black text-[14px] leading-[24px]" },
            "Dear ",
            employeeName,
            ","
          ),
          React.createElement(
            Text,
            { className: "text-black text-[14px] leading-[24px]" },
            "Congratulations! Your employment contract is now ready for your review and signature."
          ),
          React.createElement(
            Section,
            {
              className:
                "bg-gray-50 rounded-lg p-4 my-[24px] border border-gray-200",
            },
            React.createElement(
              Text,
              {
                className: "text-gray-900 text-[14px] font-semibold m-0 mb-2",
              },
              "Contract Details:"
            ),
            React.createElement(
              Text,
              { className: "text-gray-700 text-[13px] leading-[20px] m-0" },
              "Position: ",
              React.createElement("strong", null, position)
            ),
            React.createElement(
              Text,
              { className: "text-gray-700 text-[13px] leading-[20px] m-0" },
              "Department: ",
              React.createElement("strong", null, department)
            ),
            React.createElement(
              Text,
              { className: "text-gray-700 text-[13px] leading-[20px] m-0" },
              "Start Date: ",
              React.createElement("strong", null, startDate)
            ),
            React.createElement(
              Text,
              { className: "text-gray-700 text-[13px] leading-[20px] m-0" },
              "Base Salary: ",
              React.createElement("strong", null, formattedSalary, " per month")
            )
          ),
          React.createElement(
            Section,
            { className: "text-center mt-[32px] mb-[32px]" },
            React.createElement(
              Button,
              {
                className:
                  "bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3",
                href: signingLink,
              },
              "Review & Sign Contract"
            )
          ),
          React.createElement(Hr, {
            className: "border border-gray-200 my-[20px]",
          }),
          React.createElement(
            Text,
            { className: "text-gray-600 text-[12px] leading-[20px]" },
            "⚠️ Important: This signing link will expire in 7 days. Please review and sign the contract at your earliest convenience."
          ),
          React.createElement(
            Text,
            { className: "text-black text-[14px] leading-[24px]" },
            "If you have any questions about the contract terms, please contact our HR department before signing."
          ),
          React.createElement(
            Text,
            { className: "text-black text-[14px] leading-[24px]" },
            "Best regards,",
            React.createElement("br", null),
            "The Techxudo Team"
          )
        )
      )
    )
  );
};

export default ContractEmail;
