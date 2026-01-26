import { getTemplateHTML } from "../../services/documents/brandedTemplates.js";
import { generateAndUploadPDF } from "../../utils/pdfService.js";
import { createTemplateService } from "../../services/documents/templateService.js";

export const previewBrandedTemplate = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ success: false, message: "type is required" });
    // Allow lightweight branding overrides from query (useful during setup before org is fully saved)
    // Accept: companyName, logo, primary, secondary, accent
    const orgBase = req.organization || {};
    const overrides = {
      companyName: req.query.companyName || undefined,
      logo: req.query.logo || undefined,
      theme: {
        primaryColor: req.query.primary || undefined,
        secondaryColor: req.query.secondary || undefined,
        accentColor: req.query.accent || undefined,
      },
    };
    const org = {
      ...orgBase,
      ...(overrides.companyName ? { companyName: overrides.companyName } : {}),
      ...(overrides.logo ? { logo: overrides.logo } : {}),
      theme: {
        ...(orgBase.theme || {}),
        ...(overrides.theme || {}),
      },
    };
    const html = getTemplateHTML(type, org, req.body?.variables || {});
    return res.status(200).json({ success: true, html });
  } catch (e) {
    console.error("Preview template error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const generateBrandedTemplate = async (req, res) => {
  try {
    const { type, variables, fileName, branding } = req.body || {};
    if (!type) return res.status(400).json({ success: false, message: "type is required" });
    const orgBase = req.organization || {};
    const overrides = branding || {};
    const org = {
      ...orgBase,
      ...(overrides.companyName ? { companyName: overrides.companyName } : {}),
      ...(overrides.logo ? { logo: overrides.logo } : {}),
      theme: {
        ...(orgBase.theme || {}),
        ...(overrides.theme || {}),
      },
      address: {
        ...(orgBase.address || {}),
        ...(overrides.address || {}),
      },
    };
    const html = getTemplateHTML(type, org, variables || {});
    // Replace any remaining {{tokens}} with provided variables or blank to avoid downstream parser issues
    const tokenRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const finalHtml = html.replace(tokenRegex, (match, key) => {
      if (variables && Object.prototype.hasOwnProperty.call(variables, key)) {
        return variables[key] ?? "";
      }
      return "";
    });
    const url = await generateAndUploadPDF(finalHtml, fileName || type);
    return res.status(201).json({ success: true, url });
  } catch (e) {
    console.error("Generate template error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// Create an editable template pre-populated from a branded type
export const createEditableFromBranded = async (req, res) => {
  try {
    const { type, name } = req.body || {};
    if (!type) return res.status(400).json({ success: false, message: "type is required" });
    const org = req.organization || {};
    // Build editable HTML keeping placeholders intact
    const html = getTemplateHTML(type, org, {}, { editable: true });
    const templateName = name ||
      (type === 'tpl_agreement_modern' ? 'Employment Agreement (Editable)'
        : type === 'tpl_increment_letter' ? 'Increment Letter (Editable)'
        : type === 'tpl_recommendation' ? 'Recommendation Letter (Editable)'
        : type === 'tpl_experience' ? 'Experience Letter (Editable)'
        : 'Company Letter (Editable)');

    // Default to 'contract' category for now
    const saved = await createTemplateService(req.user._id, templateName, 'contract', html);
    return res.status(201).json({ success: true, data: saved });
  } catch (e) {
    console.error('Create editable from branded error:', e);
    return res.status(500).json({ success: false, message: e.message });
  }
};
