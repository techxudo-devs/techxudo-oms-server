// Build modern, brand-aware HTML templates for company documents
// Uses organization theme (primary/secondary/accent) and logo + injects placeholders

const cssBase = ({ primary, secondary, accent }) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  :root{
    --primary:${primary};
    --secondary:${secondary};
    --accent:${accent};
  }
  *{ box-sizing:border-box }
  body{ font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; margin:0 }
  .page{ width: 794px; min-height:1123px; margin:0 auto; padding:48px; position:relative; background:#fff; }
  .header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:24px }
  .brand{ display:flex; align-items:center; gap:12px }
  .logo{ width:48px; height:48px; border-radius:12px; background: var(--primary); display:flex; align-items:center; justify-content:center; overflow:hidden }
  .company{ font-weight:700; font-size:20px; color:var(--primary) }
  .tag{ padding:6px 10px; border-radius:9999px; background: color-mix(in oklch, var(--accent) 20%, white); color:#0f172a; font-weight:600; font-size:12px }
  .hero{ position:relative; overflow:hidden; border-radius:16px; padding:24px; background: linear-gradient(135deg, color-mix(in oklch, var(--primary) 18%, white), color-mix(in oklch, var(--accent) 14%, white)); margin-bottom:24px }
  .hero h1{ margin:0 0 6px 0; font-size:26px; color:#0b1220 }
  .hero p{ margin:0; color:#172036 }
  .section{ margin:24px 0 }
  .section h2{ font-size:14px; letter-spacing:.08em; text-transform:uppercase; color:#334155; margin:0 0 8px 0 }
  .card{ border:1px solid #e2e8f0; border-radius:12px; padding:16px; background:#fff }
  .row{ display:flex; gap:12px }
  .col{ flex:1 }
  .list{ line-height:1.7 }
  .footer{ margin-top:28px; padding-top:16px; border-top:1px dashed #e2e8f0; font-size:12px; color:#475569 }
  .meta{ display:flex; gap:24px; flex-wrap:wrap; font-size:12px; color:#334155 }
  .label{ font-weight:600; color:#0f172a }
`;

const abstractShapes = (primary, accent) => `
  <svg width="100%" height="120" viewBox="0 0 800 120" preserveAspectRatio="none" style="position:absolute; inset:auto 0 0 0">
    <defs>
      <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.12" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.08" />
      </linearGradient>
    </defs>
    <path d="M0,80 C160,120 320,40 480,80 C640,120 720,60 800,90 L800,120 L0,120 Z" fill="url(#g1)" />
  </svg>
`;

function htmlShell({ styles, content }) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${styles}</style></head><body>${content}</body></html>`;
}

function header({ logo, companyName, badge }) {
  return `
  <div class="header">
    <div class="brand">
      <div class="logo">${logo ? `<img src="${logo}" style="width:100%;height:100%;object-fit:contain;"/>` : ""}</div>
      <div class="company">${companyName || "Company"}</div>
    </div>
    ${badge ? `<div class="tag">${badge}</div>` : ""}
  </div>`;
}

// Resolve a token from vars/org or return a placeholder token
function resolveToken(key, org, vars = {}) {
  const orgMap = {
    company_name: org.companyName,
    company_email: org.emailSettings?.fromEmail,
    company_address: [org.address?.street, org.address?.city, org.address?.country, org.address?.zipCode].filter(Boolean).join(', '),
    current_date: new Date().toLocaleDateString(),
    date: new Date().toLocaleDateString(),
  };
  const v = vars[key] ?? orgMap[key];
  return v || `{{${key}}}`;
}

function agreementTemplate({ org, vars }) {
  const styles = cssBase({ primary: org.theme?.primaryColor || "#000000", secondary: org.theme?.secondaryColor || "#6B7280", accent: org.theme?.accentColor || "#3B82F6" });
  const hero = `
  <div class="hero">
    <h1>Employment Agreement</h1>
    <p>Between ${resolveToken('employee_name', org, vars)} and ${resolveToken('company_name', org, vars)} — ${resolveToken('date', org, vars)}</p>
    ${abstractShapes(org.theme?.primaryColor || "#000", org.theme?.accentColor || "#3B82F6")}
  </div>`;
  const body = `
    <div class="meta card">
      <div><span class="label">Company:</span> ${resolveToken('company_name', org, vars)}</div>
      <div><span class="label">Address:</span> ${resolveToken('company_address', org, vars)}</div>
      <div><span class="label">Date:</span> ${resolveToken('date', org, vars)}</div>
    </div>
    <div class="section">
      <h2>Terms</h2>
      <div class="card list">
        <ol>
          <li>Position: ${resolveToken('position', org, vars)}; Start Date: ${resolveToken('start_date', org, vars)}.</li>
          <li>Compensation: ${resolveToken('salary', org, vars)}; Benefits as per company policy.</li>
          <li>Confidentiality and IP assignment per standard policy.</li>
          <li>Termination and notice as defined by law and policy.</li>
        </ol>
      </div>
    </div>
    <div class="section row">
      <div class="col card">
        <strong>Company</strong><br/>${resolveToken('company_name', org, vars)}<br/>Authorized Signatory
      </div>
      <div class="col card">
        <strong>Employee</strong><br/>${resolveToken('employee_name', org, vars)}<br/>Signature
      </div>
    </div>
    <div class="footer">This document is auto‑generated by ${resolveToken('company_name', org, vars)} OMS.</div>
  `;
  const content = `<div class="page">${header({ logo: org.logo, companyName: org.companyName, badge: "Agreement" })}${hero}${body}</div>`;
  return htmlShell({ styles, content });
}

function simpleLetter({ org, vars, title }) {
  const styles = cssBase({ primary: org.theme?.primaryColor || "#000000", secondary: org.theme?.secondaryColor || "#6B7280", accent: org.theme?.accentColor || "#3B82F6" });
  const hero = `
  <div class="hero">
    <h1>${title}</h1>
    <p>${resolveToken('date', org, vars)}</p>
    ${abstractShapes(org.theme?.primaryColor || "#000", org.theme?.accentColor || "#3B82F6")}
  </div>`;
  const body = `
    <div class="meta card">
      <div><span class="label">From:</span> ${resolveToken('company_name', org, vars)}</div>
      <div><span class="label">Address:</span> ${resolveToken('company_address', org, vars)}</div>
      <div><span class="label">To:</span> ${resolveToken('recipient_name', org, vars)}</div>
      <div><span class="label">Date:</span> ${resolveToken('date', org, vars)}</div>
    </div>
    <div class="section">
      <h2>Recipient</h2>
      <div class="card">${resolveToken('recipient_name', org, vars)}</div>
    </div>
    <div class="section">
      <h2>Message</h2>
      <div class="card" style="line-height:1.7">
        <p>Subject: ${resolveToken('subject', org, vars)}</p>
        <p>Dear ${resolveToken('recipient_name', org, vars)},</p>
        <p>${
          title === 'Increment Letter'
            ? `We are pleased to inform you of your revised compensation. Your new salary will be ${resolveToken('salary', org, vars)} effective ${resolveToken('effective_date', org, vars)}. Your designation remains ${resolveToken('designation', org, vars)}.`
            : title === 'Recommendation Letter'
            ? `${resolveToken('employee_name', org, vars)} has served as ${resolveToken('designation', org, vars)} at ${resolveToken('company_name', org, vars)} from ${resolveToken('start_date', org, vars)} to ${resolveToken('end_date', org, vars)}. We affirm their strong performance and professional conduct.`
            : title === 'Experience Letter'
            ? `This is to certify that ${resolveToken('employee_name', org, vars)} worked with ${resolveToken('company_name', org, vars)} as ${resolveToken('designation', org, vars)} from ${resolveToken('start_date', org, vars)} to ${resolveToken('end_date', org, vars)}. During this period, ${resolveToken('employee_name', org, vars)} exhibited exemplary skills and responsibility.`
            : `This letter confirms the subject as per our records.`
        }</p>
        <p>Sincerely,<br/>${resolveToken('company_name', org, vars)}</p>
      </div>
    </div>
    <div class="section row">
      <div class="col card">
        <strong>${resolveToken('company_name', org, vars)}</strong><br/>HR Department
      </div>
      <div class="col card">
        <strong>Signature</strong><br/>____________________
      </div>
    </div>
    <div class="footer">${org.address?.city || ""} • ${org.address?.country || ""}</div>
  `;
  const content = `<div class="page">${header({ logo: org.logo, companyName: org.companyName, badge: title })}${hero}${body}</div>`;
  return htmlShell({ styles, content });
}

export function getTemplateHTML(type, org, vars = {}, options = {}) {
  const editable = options.editable === true;
  // Override resolveToken behavior in editable mode: always leave tokens
  const token = (k) => (editable ? `{{${k}}}` : resolveToken(k, org, vars));
  switch (type) {
    case "tpl_agreement_modern":
      return agreementTemplate({ org, vars: new Proxy(vars, { get: (_, k) => token(k) }) });
    case "tpl_increment_letter":
      return simpleLetter({ org, vars: new Proxy(vars, { get: (_, k) => token(k) }), title: "Increment Letter" });
    case "tpl_recommendation":
      return simpleLetter({ org, vars: new Proxy(vars, { get: (_, k) => token(k) }), title: "Recommendation Letter" });
    case "tpl_experience":
      return simpleLetter({ org, vars: new Proxy(vars, { get: (_, k) => token(k) }), title: "Experience Letter" });
    default:
      return simpleLetter({ org, vars: new Proxy(vars, { get: (_, k) => token(k) }), title: "Company Letter" });
  }
}
