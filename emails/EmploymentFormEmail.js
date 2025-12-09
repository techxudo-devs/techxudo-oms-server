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
} from "@react-email/components";
import * as React from "react";

const EmploymentFormEmail = ({
  employeeName = "Candidate",
  formLink = "http://localhost:5173/employment/form/token",
}) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Complete your employment information"),
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
            "Employment Information Form"
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
            "To proceed with your onboarding at Techxudo, we need you to complete your employment information form. This form collects necessary details for our HR records."
          ),
          React.createElement(
            Section,
            { className: "text-center mt-[32px] mb-[32px]" },
            React.createElement(
              Button,
              {
                className:
                  "bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3",
                href: formLink,
              },
              "Complete Form"
            )
          ),
          React.createElement(
            Text,
            { className: "text-black text-[14px] leading-[24px]" },
            "Please complete this form within 7 days. If you have any questions, feel free to reply to this email."
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

export default EmploymentFormEmail;
