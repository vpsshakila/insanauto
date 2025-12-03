// services/templateService.js
const FormTemplate = require("../models/FormTemplate");

class TemplateService {
  /**
   * Get all templates
   */
  async getAllTemplates() {
    try {
      const templates = await FormTemplate.find({ is_active: true })
        .sort({ created_at: -1 })
        .lean();

      return templates;
    } catch (error) {
      console.error("❌ Failed to get templates:", error.message);
      return [];
    }
  }

  /**
   * Add template
   */
  async addTemplate(formData) {
    try {
      const template = new FormTemplate({
        tid: formData.tid,
        kondisi_camera: formData.kondisiCamera,
        kondisi_nvr: formData.kondisiNVR,
        nama: formData.nama,
        perusahaan: formData.perusahaan,
        no_pegawai: formData.noPegawai,
      });

      await template.save();
      console.log(`✅ Template added: ${template._id}`);

      return template.toObject();
    } catch (error) {
      console.error("❌ Failed to add template:", error.message);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id, formData) {
    try {
      const template = await FormTemplate.findByIdAndUpdate(
        id,
        {
          tid: formData.tid,
          kondisi_camera: formData.kondisiCamera,
          kondisi_nvr: formData.kondisiNVR,
          nama: formData.nama,
          perusahaan: formData.perusahaan,
          no_pegawai: formData.noPegawai,
        },
        { new: true }
      );

      if (template) {
        console.log(`✅ Template updated: ${id}`);
      }

      return template ? template.toObject() : null;
    } catch (error) {
      console.error("❌ Failed to update template:", error.message);
      throw error;
    }
  }

  /**
   * Delete template (soft delete)
   */
  async deleteTemplate(id) {
    try {
      const result = await FormTemplate.findByIdAndUpdate(
        id,
        { is_active: false },
        { new: true }
      );

      return result !== null;
    } catch (error) {
      console.error("❌ Failed to delete template:", error.message);
      throw error;
    }
  }

  /**
   * Hard delete template
   */
  async hardDeleteTemplate(id) {
    try {
      const result = await FormTemplate.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("❌ Failed to hard delete template:", error.message);
      throw error;
    }
  }
}

module.exports = new TemplateService();
