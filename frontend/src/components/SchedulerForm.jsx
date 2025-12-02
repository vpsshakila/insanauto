import React, { useState, useEffect } from "react";

const SchedulerForm = () => {
  const [formData, setFormData] = useState({
    tid: "",
    kondisiCamera: "Baik",
    kondisiNVR: "Merekam",
    nama: "Alif Ayatullah Surojul Mubarok",
    perusahaan: "INSAN",
    noPegawai: "54440",
  });

  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule"); // 'schedule' or 'jobs'
  const [stats, setStats] = useState(null);

  // Load scheduled jobs and stats
  useEffect(() => {
    loadScheduledJobs();
    loadStats();

    // Refresh jobs every 30 seconds
    const interval = setInterval(loadScheduledJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadScheduledJobs = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/scheduled-jobs");
      const data = await response.json();
      if (data.success) {
        setScheduledJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/scheduler-stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pastikan waktu yang dikirim sudah include timezone
      const scheduleDateTime = new Date(scheduledTime);

      console.log("⏰ Frontend Time Debug:");
      console.log("   Input:", scheduledTime);
      console.log("   Date Object:", scheduleDateTime);
      console.log("   ISO String:", scheduleDateTime.toISOString());
      console.log("   Local String:", scheduleDateTime.toLocaleString("id-ID"));

      const response = await fetch("http://localhost:3000/api/schedule-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          scheduledTime: scheduleDateTime.toISOString(), // Kirim sebagai ISO string
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ Form berhasil dijadwalkan!\nJob ID: ${
            result.jobId
          }\nWaktu: ${new Date(result.scheduledTime).toLocaleString("id-ID")}`
        );
        setFormData({
          tid: "",
          kondisiCamera: "Baik",
          kondisiNVR: "Merekam",
          nama: "",
          perusahaan: "",
          noPegawai: "",
        });
        setScheduledTime("");
        loadScheduledJobs();
        loadStats();
      } else {
        alert(`❌ Gagal: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (jobId) => {
    if (!confirm("Yakin ingin membatalkan jadwal ini?")) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/scheduled-jobs/${jobId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("✅ Job berhasil dibatalkan");
        loadScheduledJobs();
        loadStats();
      } else {
        alert(`❌ Gagal membatalkan: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#fff3cd";
      case "processing":
        return "#cce7ff";
      case "completed":
        return "#d4edda";
      case "failed":
        return "#f8d7da";
      default:
        return "#f8f9fa";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "🕐 Terjadwal";
      case "processing":
        return "🔄 Diproses";
      case "completed":
        return "✅ Selesai";
      case "failed":
        return "❌ Gagal";
      default:
        return status;
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        📅 Google Form Scheduler
      </h1>

      {/* Stats */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "10px",
              backgroundColor: "#e9ecef",
              textAlign: "center",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {stats.total}
            </div>
            <div>Total</div>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#fff3cd",
              textAlign: "center",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {stats.scheduled}
            </div>
            <div>Terjadwal</div>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#cce7ff",
              textAlign: "center",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {stats.processing}
            </div>
            <div>Diproses</div>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#d4edda",
              textAlign: "center",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {stats.completed}
            </div>
            <div>Berhasil</div>
          </div>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f8d7da",
              textAlign: "center",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {stats.failed}
            </div>
            <div>Gagal</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("schedule")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "schedule" ? "#007bff" : "#f8f9fa",
            color: activeTab === "schedule" ? "white" : "black",
            border: "1px solid #dee2e6",
            cursor: "pointer",
          }}
        >
          📋 Jadwalkan Form
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "jobs" ? "#007bff" : "#f8f9fa",
            color: activeTab === "jobs" ? "white" : "black",
            border: "1px solid #dee2e6",
            cursor: "pointer",
          }}
        >
          📊 Jadwal Terprogram ({scheduledJobs.length})
        </button>
      </div>

      {/* Schedule Form */}
      {activeTab === "schedule" && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3>🗓️ Jadwalkan Pengiriman Form</h3>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              {/* TID */}
              <div>
                <label>
                  <strong>TID *</strong>
                </label>
                <input
                  type="text"
                  name="tid"
                  value={formData.tid}
                  onChange={handleChange}
                  required
                  placeholder="190410"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>

              {/* Nama */}
              <div>
                <label>
                  <strong>Nama Petugas *</strong>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>

              {/* Perusahaan */}
              <div>
                <label>
                  <strong>Perusahaan *</strong>
                </label>
                <input
                  type="text"
                  name="perusahaan"
                  value={formData.perusahaan}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>

              {/* No Pegawai */}
              <div>
                <label>
                  <strong>No Pegawai *</strong>
                </label>
                <input
                  type="text"
                  name="noPegawai"
                  value={formData.noPegawai}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>

              {/* Kondisi Camera */}
              <div>
                <label>
                  <strong>Kondisi Camera *</strong>
                </label>
                <select
                  name="kondisiCamera"
                  value={formData.kondisiCamera}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Baik">✅ Baik</option>
                  <option value="Problem">❌ Problem</option>
                </select>
              </div>

              {/* Kondisi NVR */}
              <div>
                <label>
                  <strong>Kondisi NVR *</strong>
                </label>
                <select
                  name="kondisiNVR"
                  value={formData.kondisiNVR}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Merekam">✅ Merekam</option>
                  <option value="Problem">❌ Problem</option>
                </select>
              </div>
            </div>

            {/* Schedule Time */}
            <div style={{ marginTop: "20px" }}>
              <label>
                <strong>📅 Waktu Penjadwalan *</strong>
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <small>Pilih tanggal dan waktu untuk pengiriman otomatis</small>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "20px",
                padding: "12px 30px",
                backgroundColor: loading ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {loading ? "🔄 Menjadwalkan..." : "🗓️ Jadwalkan Pengiriman"}
            </button>
          </form>
        </div>
      )}

      {/* Jobs List */}
      {activeTab === "jobs" && (
        <div>
          <h3>📊 Daftar Jadwal Terprogram</h3>
          {scheduledJobs.length === 0 ? (
            <p
              style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}
            >
              Belum ada jadwal terprogram
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {scheduledJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    padding: "15px",
                    backgroundColor: getStatusColor(job.status),
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>
                          📋 TID: {job.formData.tid} - {job.formData.nama}
                        </strong>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            backgroundColor:
                              job.status === "completed"
                                ? "#28a745"
                                : job.status === "failed"
                                ? "#dc3545"
                                : job.status === "processing"
                                ? "#007bff"
                                : "#ffc107",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          {getStatusText(job.status)}
                        </span>
                      </div>

                      <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                        <strong>🏢 Perusahaan:</strong>{" "}
                        {job.formData.perusahaan} |
                        <strong> 🔢 No Pegawai:</strong>{" "}
                        {job.formData.noPegawai}
                      </div>

                      <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                        <strong>📷 Camera:</strong> {job.formData.kondisiCamera}{" "}
                        |<strong> 💾 NVR:</strong> {job.formData.kondisiNVR}
                      </div>

                      <div style={{ fontSize: "14px", color: "#666" }}>
                        <strong>🕐 Dijadwalkan:</strong>{" "}
                        {formatDate(job.scheduledTime)}
                        <br />
                        <strong>📅 Dibuat:</strong> {formatDate(job.createdAt)}
                        {job.completedAt && (
                          <>
                            <br />
                            <strong>✅ Selesai:</strong>{" "}
                            {formatDate(job.completedAt)}
                          </>
                        )}
                      </div>

                      {job.result && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: job.result.success
                              ? "#d4edda"
                              : "#f8d7da",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        >
                          <strong>Hasil:</strong>{" "}
                          {job.result.success ? "✅" : "❌"}{" "}
                          {job.result.message}
                        </div>
                      )}
                    </div>

                    {job.status === "scheduled" && (
                      <button
                        onClick={() => cancelJob(job.id)}
                        style={{
                          marginLeft: "15px",
                          padding: "8px 12px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulerForm;
