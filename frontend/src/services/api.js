// services/api.js
const API_BASE_URL = "http://localhost:3000/api";

export const apiService = {
  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Submit form LANGSUNG
  async submitForm(formData) {
    const response = await fetch(`${API_BASE_URL}/submit-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // SCHEDULE form submission (BARU!)
  async scheduleForm(formData, scheduledTime) {
    const response = await fetch(`${API_BASE_URL}/schedule-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, scheduledTime }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // BATCH SCHEDULE - Schedule multiple forms at once (BARU!)
  async scheduleBatch(formDataList, scheduledTime) {
    const response = await fetch(`${API_BASE_URL}/schedule-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formDataList, scheduledTime }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get all jobs
  async getJobs() {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) throw new Error("Failed to fetch jobs");
    return await response.json();
  },

  // Get single job
  async getJob(jobId) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (!response.ok) throw new Error("Failed to fetch job");
    return await response.json();
  },

  // Cancel job
  async cancelJob(jobId) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to cancel job");
    return await response.json();
  },

  // Delete job
  async deleteJob(jobId) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete job");
    return await response.json();
  },

  // ========== FORM TEMPLATES (NEW!) ==========

  // Get all templates
  async getTemplates() {
    const response = await fetch(`${API_BASE_URL}/templates`);
    if (!response.ok) throw new Error("Failed to fetch templates");
    return await response.json();
  },

  // Add template
  async addTemplate(formData) {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData }),
    });
    if (!response.ok) throw new Error("Failed to add template");
    return await response.json();
  },

  // Update template
  async updateTemplate(id, formData) {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData }),
    });
    if (!response.ok) throw new Error("Failed to update template");
    return await response.json();
  },

  // Delete template
  async deleteTemplate(id) {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete template");
    return await response.json();
  },
};
