import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";

const GoogleForm = () => {
  const [formData, setFormData] = useState({
    tid: "",
    kondisiCamera: "Baik",
    kondisiNVR: "Merekam",
    nama: "",
    perusahaan: "",
    noPegawai: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");

  // State untuk scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledJobs, setScheduledJobs] = useState([]);

  useEffect(() => {
    checkBackendConnection();
    loadScheduledJobs();
  }, []);

  const checkBackendConnection = async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus("connected");
    } catch (error) {
      setBackendStatus("disconnected");
      console.error("Backend connection failed:", error);
    }
  };

  const loadScheduledJobs = async () => {
    try {
      const response = await apiService.getJobs();
      if (response.success) {
        setScheduledJobs(response.jobs);
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let response;

      if (isScheduled) {
        // Submit dengan schedule
        if (!scheduledTime) {
          throw new Error("Pilih waktu penjadwalan!");
        }
        response = await apiService.scheduleForm(formData, scheduledTime);
        setResult({
          ...response,
          message: `Form berhasil dijadwalkan untuk ${new Date(
            scheduledTime
          ).toLocaleString("id-ID")}`,
        });

        // Reload jobs list
        await loadScheduledJobs();
      } else {
        // Submit langsung
        response = await apiService.submitForm(formData);
        setResult(response);
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Error: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await apiService.cancelJob(jobId);
      await loadScheduledJobs();
      alert("Job berhasil dibatalkan!");
    } catch (error) {
      alert("Gagal membatalkan job: " + error.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Yakin mau hapus job ini?")) return;

    try {
      await apiService.deleteJob(jobId);
      await loadScheduledJobs();
      alert("Job berhasil dihapus!");
    } catch (error) {
      alert("Gagal menghapus job: " + error.message);
    }
  };

  // Helper: Get minimum datetime untuk input (5 menit dari sekarang)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ color: "#333", textAlign: "center" }}>
        📋 Google Form Automation with Scheduler
      </h1>

      {/* Backend Status */}
      <div
        style={{
          padding: "10px",
          marginBottom: "20px",
          backgroundColor:
            backendStatus === "connected" ? "#d4edda" : "#f8d7da",
          border: `1px solid ${
            backendStatus === "connected" ? "#c3e6cb" : "#f5c6cb"
          }`,
          borderRadius: "4px",
          textAlign: "center",
        }}
      >
        {backendStatus === "connected"
          ? "✅ Backend Connected"
          : backendStatus === "disconnected"
          ? "❌ Backend Disconnected"
          : "🔄 Checking..."}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* FORM SECTION */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>📝 Form Input</h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {/* TID */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                TID *
              </label>
              <input
                type="text"
                name="tid"
                value={formData.tid}
                onChange={handleChange}
                required
                placeholder="Contoh: 190410"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              />
            </div>

            {/* Kondisi Camera */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Kondisi Camera CCTV *
              </label>
              <div style={{ display: "flex", gap: "15px" }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    type="radio"
                    name="kondisiCamera"
                    value="Baik"
                    checked={formData.kondisiCamera === "Baik"}
                    onChange={handleChange}
                  />
                  ✅ Baik
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    type="radio"
                    name="kondisiCamera"
                    value="Problem"
                    checked={formData.kondisiCamera === "Problem"}
                    onChange={handleChange}
                  />
                  ❌ Problem
                </label>
              </div>
            </div>

            {/* Kondisi NVR */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Kondisi NVR *
              </label>
              <div style={{ display: "flex", gap: "15px" }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    type="radio"
                    name="kondisiNVR"
                    value="Merekam"
                    checked={formData.kondisiNVR === "Merekam"}
                    onChange={handleChange}
                  />
                  ✅ Merekam
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    type="radio"
                    name="kondisiNVR"
                    value="Problem"
                    checked={formData.kondisiNVR === "Problem"}
                    onChange={handleChange}
                  />
                  ❌ Problem
                </label>
              </div>
            </div>

            {/* Nama, Perusahaan, No Pegawai */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Nama Petugas *
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Perusahaan *
              </label>
              <input
                type="text"
                name="perusahaan"
                value={formData.perusahaan}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                No Pegawai *
              </label>
              <input
                type="text"
                name="noPegawai"
                value={formData.noPegawai}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              />
            </div>

            {/* TOGGLE SCHEDULE */}
            <div
              style={{
                backgroundColor: "#fff",
                padding: "15px",
                borderRadius: "6px",
                border: "2px solid #007bff",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ fontWeight: "bold" }}>
                  ⏰ Jadwalkan submit (tidak langsung)
                </span>
              </label>

              {isScheduled && (
                <div style={{ marginTop: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                    }}
                  >
                    Pilih waktu submit:
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={getMinDateTime()}
                    required={isScheduled}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Minimal 5 menit dari sekarang
                  </small>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || backendStatus !== "connected"}
              style={{
                padding: "12px",
                backgroundColor:
                  loading || backendStatus !== "connected" ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  loading || backendStatus !== "connected"
                    ? "not-allowed"
                    : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {loading
                ? "🔄 Processing..."
                : isScheduled
                ? "📅 Jadwalkan Submit"
                : "📤 Submit Sekarang"}
            </button>
          </form>

          {/* Result Display */}
          {result && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: result.success ? "#d4edda" : "#f8d7da",
                border: `1px solid ${result.success ? "#c3e6cb" : "#f5c6cb"}`,
                borderRadius: "4px",
              }}
            >
              <h3
                style={{
                  color: result.success ? "#155724" : "#721c24",
                  margin: "0 0 10px 0",
                }}
              >
                {result.success ? "✅ Success!" : "❌ Error"}
              </h3>
              <p style={{ margin: 0 }}>{result.message}</p>
            </div>
          )}
        </div>

        {/* SCHEDULED JOBS SECTION */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>📅 Scheduled Jobs</h2>
            <button
              onClick={loadScheduledJobs}
              style={{
                padding: "6px 12px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🔄 Refresh
            </button>
          </div>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {scheduledJobs.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                Belum ada jobs yang dijadwalkan
              </p>
            ) : (
              scheduledJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    backgroundColor: "#fff",
                    padding: "12px",
                    marginBottom: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>TID: {job.tid}</strong>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        backgroundColor:
                          job.status === "completed"
                            ? "#d4edda"
                            : job.status === "failed"
                            ? "#f8d7da"
                            : job.status === "pending"
                            ? "#fff3cd"
                            : "#e2e3e5",
                        color:
                          job.status === "completed"
                            ? "#155724"
                            : job.status === "failed"
                            ? "#721c24"
                            : job.status === "pending"
                            ? "#856404"
                            : "#383d41",
                      }}
                    >
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div>
                      ⏰ {new Date(job.scheduled_time).toLocaleString("id-ID")}
                    </div>
                    <div>👤 {job.nama}</div>
                  </div>

                  {job.status === "pending" && (
                    <div
                      style={{ marginTop: "10px", display: "flex", gap: "8px" }}
                    >
                      <button
                        onClick={() => handleCancelJob(job.job_id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#ffc107",
                          color: "#000",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        ⏸️ Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.job_id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleForm;
