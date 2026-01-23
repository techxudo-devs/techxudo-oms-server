import { getTemplateHTML } from "../../services/documents/brandedTemplates.js";
import { generateAndUploadPDF } from "../../utils/pdfService.js";

export const previewBrandedTemplate = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ success: false, message: "type is required" });
    const org = req.organization || {};
    const html = getTemplateHTML(type, org, req.body?.variables || {});
    return res.status(200).json({ success: true, html });
  } catch (e) {
    console.error("Preview template error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const generateBrandedTemplate = async (req, res) => {
  try {
    const { type, variables, fileName } = req.body || {};
    if (!type) return res.status(400).json({ success: false, message: "type is required" });
    const org = req.organization || {};
    const html = getTemplateHTML(type, org, variables || {});
    const url = await generateAndUploadPDF(html, fileName || type);
    return res.status(201).json({ success: true, url });
  } catch (e) {
    console.error("Generate template error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

