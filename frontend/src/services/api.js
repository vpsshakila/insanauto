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
};
